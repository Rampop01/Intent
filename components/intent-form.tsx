'use client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, AlertCircle, Mic, MicOff, Volume2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createVoiceService, getVoiceServiceStatus, VoiceService, VoiceServiceStatus } from '@/lib/voice-service';
import { InlineLoader } from './ui/loader';

interface IntentFormProps {
  onStrategyGenerated: (strategy: any) => void;
}

// Preset strategies
const PRESET_STRATEGIES = {
  safe_save: {
    intent: 'Save safely with minimal risk (TCRO equivalent of $200)',
    amount: '200', // Will be converted to TCRO equivalent
    riskLevel: 'low' as const,
    allocation: { stable: 85, liquid: 15, growth: 0 },
    execution: 'once' as const,
    monitoring: 'monthly',
    explanation:
      'Conservative strategy focusing on capital preservation. 85% swapped to stablecoins (USDC/USDT), 15% in liquid tokens.',
  },
  balanced_invest: {
    intent: 'Invest with balanced growth and risk (TCRO equivalent of $500)',
    amount: '500', // Will be converted to TCRO equivalent
    riskLevel: 'medium' as const,
    allocation: { stable: 40, liquid: 30, growth: 30 },
    execution: 'weekly' as const,
    monitoring: 'weekly',
    explanation:
      'Balanced approach for steady growth. 40% to stablecoins, 30% liquid tokens, 30% staked for rewards.',
  },
  aggressive_growth: {
    intent: 'Deploy aggressively for maximum growth (TCRO equivalent of $1000)',
    amount: '1000', // Will be converted to TCRO equivalent
    riskLevel: 'high' as const,
    allocation: { stable: 10, liquid: 20, growth: 70 },
    execution: 'weekly' as const,
    monitoring: 'daily',
    explanation:
      'Growth-focused strategy for experienced investors. 10% stablecoins, 20% liquid, 70% staked with validators.',
  },
};

export function IntentForm({ onStrategyGenerated }: IntentFormProps) {
  const { walletConnected, setStrategy, currentStrategy } = useApp();
  const [intent, setIntent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceServiceStatus | null>(null);

  // Check for voice support and initialize service
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const status = getVoiceServiceStatus();
      setVoiceStatus(status);
      console.log('[Voice] Service status:', status);
    }
  }, []);

  // Initialize voice service with hybrid approach
  useEffect(() => {
    if (!voiceStatus?.isSupported) return;

    // Create voice service with configuration
    voiceServiceRef.current = createVoiceService({
      onTranscript: (transcript: string, isFinal: boolean) => {
        setTranscribedText(transcript);
        if (isFinal && transcript.trim()) {
          setShowTranscription(true);
        }
      },
      onError: (error: string) => {
        setIsListening(false);
        setIsRecording(false);
        setVoiceError(error);
      },
      onStart: () => {
        setIsListening(true);
        setVoiceError(null);
      },
      onEnd: () => {
        setIsListening(false);
        setIsRecording(false);
      }
    });

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
    };
  }, [voiceStatus]);

  const startVoiceInput = async () => {
    if (!voiceServiceRef.current) return;
    
    setTranscribedText('');
    setShowTranscription(false);
    setVoiceError(null);
    setIsRecording(true);
    
    try {
      await voiceServiceRef.current.start();
    } catch (error) {
      console.error('[Voice] Start error:', error);
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stop();
    }
  };

  const confirmTranscription = () => {
    setIntent(transcribedText);
    setShowTranscription(false);
    setTranscribedText('');
  };

  const cancelTranscription = () => {
    setTranscribedText('');
    setShowTranscription(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!intent.trim() || !walletConnected) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('[v0] Parsing intent:', intent);

      // Call real AI parsing API
      const response = await fetch('/api/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse intent');
      }

      const parsedIntent = await response.json();
      console.log('[v0] Parsed intent result:', parsedIntent);

      // Validate the parsed intent has all required fields
      if (!parsedIntent || !parsedIntent.amount || !parsedIntent.riskLevel || !parsedIntent.allocation) {
        throw new Error('Invalid API response: missing required fields');
      }

      const strategyData = {
        intent,
        amount: parsedIntent.amount.toString(), // Convert to string
        riskLevel: parsedIntent.riskLevel,
        allocation: parsedIntent.allocation,
        execution: parsedIntent.executionType || 'once',
        monitoring: parsedIntent.monitoring || 'weekly',
        explanation: parsedIntent.explanation || 'AI-generated investment strategy',
      };

      console.log('[v0] Setting strategy:', strategyData);
      setStrategy(strategyData);

      setIntent('');
      onStrategyGenerated(strategyData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse intent';
      console.error('[v0] Error:', message);
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handlePreset(key: string) {
    const strategy = PRESET_STRATEGIES[key as keyof typeof PRESET_STRATEGIES];
    
    if (!strategy) {
      console.error('[v0] Invalid preset strategy key:', key);
      setError(`Invalid strategy preset: ${key}`);
      return;
    }
    
    console.log('[v0] Using preset strategy:', key, strategy);
    setStrategy(strategy);
    setError(null);
    onStrategyGenerated(strategy);
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Voice Error Alert */}
      {voiceError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{voiceError}</AlertDescription>
        </Alert>
      )}

      {/* Voice Service Status Info */}
      {voiceStatus && !voiceStatus.isSupported && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Voice input not available:</strong> {voiceStatus.reason || 'Speech recognition not supported in your browser.'}
            {' '}Text input works perfectly as an alternative.
          </AlertDescription>
        </Alert>
      )}

      {/* Deepgram Service Info for Brave users */}
      {voiceStatus?.provider === 'Deepgram' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Enhanced Voice Support:</strong> Using Deepgram for better compatibility with your browser.
            Voice input will work seamlessly with improved accuracy.
          </AlertDescription>
        </Alert>
      )}

      {/* Transcription Preview */}
      {showTranscription && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Volume2 className="h-4 w-4" />
              Voice Input Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Here's what we heard you say. Please confirm if this is correct:
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{transcribedText}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmTranscription} size="sm" className="gap-2">
                <ArrowRight className="h-3 w-3" />
                Use This Text
              </Button>
              <Button onClick={cancelTranscription} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Intent Input */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Express Your Intent
          </CardTitle>
          <CardDescription>
            Describe what you want to do with your money by typing or speaking. Our AI will parse your intent and create a strategy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="e.g., Save $200 safely, invest $500 with balanced risk, deploy $1000 aggressively for weekly rebalancing..."
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                disabled={!walletConnected || isProcessing}
                className="min-h-24 resize-none pr-14"
              />
              {voiceStatus?.isSupported && (
                <div className="absolute right-2 top-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopVoiceInput : startVoiceInput}
                    disabled={!walletConnected || isProcessing || showTranscription}
                    className={`p-2 h-8 w-8 ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground hover:text-primary'}`}
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  {isListening && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>
              )}
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening... Speak your financial goal
              </div>
            )}
            <Button
              type="submit"
              disabled={!intent.trim() || !walletConnected || isProcessing}
              className="w-full gap-2"
              size="lg"
            >
              {isProcessing ? (
                <InlineLoader text="Processing with AI..." />
              ) : (
                <>
                  Generate Strategy
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preset Strategies */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Templates</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            variant={currentStrategy?.amount === '200' ? 'default' : 'outline'}
            onClick={() => handlePreset('safe_save')}
            disabled={!walletConnected}
            className="flex-col items-start h-auto p-4"
          >
            <div className="font-semibold">Safe Save</div>
            <div className="text-xs opacity-75">$200, Low Risk</div>
          </Button>
          <Button
            variant={currentStrategy?.amount === '500' ? 'default' : 'outline'}
            onClick={() => handlePreset('balanced_invest')}
            disabled={!walletConnected}
            className="flex-col items-start h-auto p-4"
          >
            <div className="font-semibold">Balanced</div>
            <div className="text-xs opacity-75">$500, Medium Risk</div>
          </Button>
          <Button
            variant={currentStrategy?.amount === '1000' ? 'default' : 'outline'}
            onClick={() => handlePreset('aggressive_growth')}
            disabled={!walletConnected}
            className="flex-col items-start h-auto p-4"
          >
            <div className="font-semibold">Growth</div>
            <div className="text-xs opacity-75">$1000, High Risk</div>
          </Button>
        </div>
      </div>
    </div>
  );
}

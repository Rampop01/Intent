'use client';

import { createClient } from '@deepgram/sdk';

// Voice service interface
export interface VoiceServiceConfig {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export interface VoiceService {
  start(): Promise<void>;
  stop(): void;
  isSupported(): boolean;
  getProviderName(): string;
}

// Web Speech API implementation (Chrome, Safari, Edge)
class WebSpeechService implements VoiceService {
  private recognition: any = null;
  private config: VoiceServiceConfig;

  constructor(config: VoiceServiceConfig) {
    this.config = config;
  }

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  getProviderName(): string {
    return 'Web Speech API';
  }

  async start(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Speech API not supported');
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.config.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript + interimTranscript;
      this.config.onTranscript(fullTranscript, finalTranscript.length > 0);
    };

    this.recognition.onend = () => {
      this.config.onEnd();
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = '';
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not available. Please check your internet connection.';
          break;
        case 'network':
          errorMessage = 'Network error. Speech recognition requires an internet connection.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking closer to your microphone.';
          break;
        default:
          errorMessage = `Voice recognition error: ${event.error}`;
      }
      this.config.onError(errorMessage);
    };

    this.recognition.start();
  }

  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Deepgram implementation (Brave, Firefox, fallback)
class DeepgramService implements VoiceService {
  private config: VoiceServiceConfig;
  private mediaRecorder: MediaRecorder | null = null;
  private websocket: WebSocket | null = null;
  private stream: MediaStream | null = null;

  constructor(config: VoiceServiceConfig) {
    this.config = config;
  }

  isSupported(): boolean {
    return 'MediaRecorder' in window && 'WebSocket' in window;
  }

  getProviderName(): string {
    return 'Deepgram';
  }

  async start(): Promise<void> {
    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      // Connect to Deepgram WebSocket
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('Deepgram API key not configured');
      }

      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true`;
      this.websocket = new WebSocket(wsUrl, ['token', apiKey]);

      this.websocket.onopen = () => {
        console.log('[Deepgram] WebSocket connected');
        this.config.onStart();
        this.startRecording();
      };

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          const isFinal = data.is_final || false;
          
          if (transcript.trim()) {
            this.config.onTranscript(transcript, isFinal);
          }
        }
      };

      this.websocket.onerror = (error) => {
        console.error('[Deepgram] WebSocket error:', error);
        this.config.onError('Deepgram connection error. Please check your internet connection.');
      };

      this.websocket.onclose = () => {
        console.log('[Deepgram] WebSocket closed');
        this.config.onEnd();
      };

    } catch (error) {
      console.error('[Deepgram] Start error:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        this.config.onError('Microphone access denied. Please allow microphone permissions in your browser.');
      } else {
        this.config.onError('Could not start voice recognition with Deepgram. Please try again.');
      }
    }
  }

  private startRecording(): void {
    if (!this.stream || !this.websocket) return;

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN && event.data.size > 0) {
        this.websocket.send(event.data);
      }
    };

    this.mediaRecorder.start(100); // Send data every 100ms
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    this.mediaRecorder = null;
    this.websocket = null;
    this.stream = null;
  }
}

// Browser detection utilities
export function isBrave(): boolean {
  return typeof window !== 'undefined' && (navigator as any).brave !== undefined;
}

export function isFirefox(): boolean {
  return typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox');
}

export function shouldUseDeepgram(): boolean {
  // Use Deepgram for Brave or when Web Speech API is not available
  const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  return isBrave() || isFirefox() || !hasSpeechRecognition;
}

// Factory function to create the appropriate voice service
export function createVoiceService(config: VoiceServiceConfig): VoiceService {
  if (shouldUseDeepgram()) {
    console.log('[Voice] Using Deepgram service');
    return new DeepgramService(config);
  } else {
    console.log('[Voice] Using Web Speech API service');
    return new WebSpeechService(config);
  }
}

// Voice service status
export interface VoiceServiceStatus {
  isSupported: boolean;
  provider: string;
  reason?: string;
}

export function getVoiceServiceStatus(): VoiceServiceStatus {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      provider: 'none',
      reason: 'Server-side rendering'
    };
  }

  if (shouldUseDeepgram()) {
    const deepgramService = new DeepgramService({} as any);
    return {
      isSupported: deepgramService.isSupported(),
      provider: 'Deepgram',
      reason: isBrave() ? 'Brave browser detected' : 'Web Speech API not available'
    };
  } else {
    const webSpeechService = new WebSpeechService({} as any);
    return {
      isSupported: webSpeechService.isSupported(),
      provider: 'Web Speech API'
    };
  }
}
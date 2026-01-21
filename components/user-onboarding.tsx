'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Mic, 
  Shield, 
  Clock, 
  CheckCircle2,
  Play,
  BookOpen,
  Brain
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export function UserOnboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Intent AI',
      description: 'Your personal AI financial assistant',
      icon: Sparkles,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Simple Financial Management</h3>
          <p className="text-muted-foreground">
            Tell us what you want to do with your money in plain English. 
            Our AI understands your goals and handles all the complex blockchain operations for you.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-primary">No crypto knowledge required!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Just describe your financial goals and we'll take care of the rest.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'voice-text',
      title: 'Express Your Intent',
      description: 'Type or speak your financial goals',
      icon: Mic,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Two Ways to Tell Us What You Want</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Type Your Goal</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Write what you want to do in the text box.
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-mono">"Save $200 safely"</p>
                <p className="text-xs font-mono">"Invest $500 with balanced risk"</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Mic className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">Speak Your Goal</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Click the microphone button and speak naturally.
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs">🎤 Press and speak your intent</p>
                <p className="text-xs text-muted-foreground">Review before submitting</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="mb-2">Pro Tip</Badge>
            <p className="text-sm text-muted-foreground">
              Be specific about amounts and timeframes for better results
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'approval',
      title: 'Review & Approve',
      description: 'You stay in control of every decision',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Nothing Happens Without Your Approval</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">AI Creates a Plan</h4>
                <p className="text-xs text-muted-foreground">
                  Our AI analyzes your intent and creates a detailed strategy
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">You Review Everything</h4>
                <p className="text-xs text-muted-foreground">
                  See exactly how your money will be allocated and why
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <Play className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">You Give Final Approval</h4>
                <p className="text-xs text-muted-foreground">
                  Only when you're satisfied, we execute the strategy
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              You can modify or cancel at any time
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
              Change allocations, pause strategies, or stop recurring actions whenever you want.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'monitoring',
      title: 'Ongoing Monitoring',
      description: 'Set it and forget it, or stay hands-on',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Choose Your Level of Involvement</h3>
          
          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                One-Time Strategies
              </h4>
              <p className="text-sm text-muted-foreground">
                Execute once and you're done. Perfect for simple savings or one-off investments.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-green-500" />
                Recurring Strategies
              </h4>
              <p className="text-sm text-muted-foreground">
                Weekly, daily, or monthly rebalancing. The AI monitors and adjusts automatically.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-500" />
                Smart Conditions
              </h4>
              <p className="text-sm text-muted-foreground">
                "Reduce risk if market drops" - Set conditions that trigger automatic adjustments.
              </p>
            </div>
          </div>

          <div className="text-center bg-primary/5 p-4 rounded-lg">
            <p className="text-sm font-medium">Complete transparency</p>
            <p className="text-xs text-muted-foreground mt-1">
              See exactly what actions were taken, when, and why in your activity timeline.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
            <p className="text-muted-foreground">
              Ready to start managing your finances with AI assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Badge variant="outline" className="mb-2">
              Step {currentStep + 1} of {steps.length}
            </Badge>
            <Progress value={progress} className="max-w-md mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Getting Started</h1>
          <p className="text-muted-foreground">
            Learn how Intent AI makes financial management simple and safe
          </p>
        </div>

        {/* Main Content */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <currentStepData.icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
            <CardDescription className="text-base">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStepData.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 max-w-3xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext} className="gap-2">
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <Button variant="ghost" size="sm" onClick={onComplete} className="text-muted-foreground">
            Skip tutorial and start using the app
          </Button>
        </div>
      </div>
    </div>
  );
}
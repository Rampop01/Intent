'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Brain, Shield } from 'lucide-react';
import { CryptoTicker } from '@/components/crypto-ticker';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-background to-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <h1 className="text-2xl font-bold text-primary">Intent AI</h1>
        <div className="flex gap-4">
          <Link href="/app">
            <Button variant="outline">Launch App</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 text-center md:px-12 md:py-32 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/ai.png)' }}>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50 "></div>
        <div className="relative z-10 mx-auto max-w-4xl space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Tell us what you want.
              <span className="block bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                The AI handles the rest.
              </span>
            </h2>
            <p className="text-balance text-lg text-muted-foreground md:text-xl">
              Transform your financial intent into on-chain execution. Our AI agent understands your goals and executes settlements on Cronos EVM with x402.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/app">
              <Button size="lg" className="gap-2">
                Start Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Crypto Ticker */}
      <CryptoTicker />

      {/* How It Works */}
      <section className="relative px-6 py-20 md:px-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none"></div>
        
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From natural language to on-chain execution in three simple steps
            </p>
          </div>

          <div className="grid gap-8 md:gap-12 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="group relative">
              <div className="relative rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                {/* Step number badge */}
                <div className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl shadow-lg">
                  1
                </div>
                
                {/* AI-themed visual */}
                <div className="mb-6 relative h-48 rounded-2xl bg-linear-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent"></div>
                  <Brain className="h-20 w-20 text-primary relative z-10" />
                  {/* Decorative dots */}
                  <div className="absolute top-4 left-4 h-2 w-2 rounded-full bg-primary/40"></div>
                  <div className="absolute bottom-6 right-6 h-3 w-3 rounded-full bg-accent/40"></div>
                  <div className="absolute top-1/2 right-8 h-2 w-2 rounded-full bg-primary/30"></div>
                </div>
                
                <h4 className="mb-4 text-2xl font-bold text-foreground">
                  Express Your Intent
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Simply describe what you want to do with your crypto in plain English. No technical jargon needed—just tell us your goals.
                </p>
                
                {/* Connection line (desktop only) */}
                <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-linear-to-r from-border to-transparent"></div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="relative rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-2">
                {/* Step number badge */}
                <div className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-xl shadow-lg">
                  2
                </div>
                
                {/* AI-themed visual */}
                <div className="mb-6 relative h-48 rounded-2xl bg-linear-to-br from-accent/20 via-primary/10 to-accent/5 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent"></div>
                  {/* AI Image */}
                  <div className="relative h-32 w-32 z-10">
                    <Image
                      src="/loader.jpg"
                      alt="AI Processing"
                      fill
                      className="object-cover rounded-full"
                      priority
                    />
                  </div>
                  {/* Animated circuit-like lines */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-8 left-8 w-16 h-0.5 bg-accent"></div>
                    <div className="absolute top-8 left-8 w-0.5 h-16 bg-accent"></div>
                    <div className="absolute bottom-12 right-12 w-20 h-0.5 bg-primary"></div>
                    <div className="absolute bottom-12 right-12 w-0.5 h-12 bg-primary"></div>
                  </div>
                </div>
                
                <h4 className="mb-4 text-2xl font-bold text-foreground">
                  AI Generates Strategy
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Our intelligent agent analyzes your intent, evaluates risks, and creates an optimized execution strategy tailored to your goals.
                </p>
                
                {/* Connection line (desktop only) */}
                <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-linear-to-r from-border to-transparent"></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="relative rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                {/* Step number badge */}
                <div className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl shadow-lg">
                  3
                </div>
                
                {/* On-Chain visual */}
                <div className="mb-6 relative h-48 rounded-2xl bg-linear-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent"></div>
                  {/* On-Chain Image */}
                  <div className="relative h-32 w-32 z-10">
                    <Image
                      src="/onchain.jpg"
                      alt="On-Chain Execution"
                      fill
                      className="object-cover rounded-full"
                      priority
                    />
                  </div>
                  {/* Secure network nodes */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-6 left-1/4 h-3 w-3 rounded-full bg-primary"></div>
                    <div className="absolute top-12 right-1/4 h-2 w-2 rounded-full bg-accent"></div>
                    <div className="absolute bottom-8 left-1/3 h-2 w-2 rounded-full bg-primary"></div>
                    <div className="absolute bottom-12 right-1/3 h-3 w-3 rounded-full bg-accent"></div>
                  </div>
                </div>
                
                <h4 className="mb-4 text-2xl font-bold text-foreground">
                  Execute On-Chain
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Review your strategy and approve with one click. Transactions execute securely on Cronos EVM with atomic settlement.
                </p>
              </div>
            </div>
          </div>

          {/* Call to action below steps */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6">
              Ready to experience the future of DeFi?
            </p>
            <Link href="/app">
              <Button size="lg" className="gap-2">
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border px-6 py-20 md:px-12">
        <div className="mx-auto max-w-5xl">
          <h3 className="mb-16 text-center text-3xl font-bold text-foreground">
            Why Intent AI
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-card p-6 border border-border">
              <h4 className="mb-2 font-semibold text-foreground">
                Natural Language Interface
              </h4>
              <p className="text-sm text-muted-foreground">
                No need to understand DeFi protocols. Describe your goals naturally.
              </p>
            </div>
            <div className="rounded-xl bg-card p-6 border border-border">
              <h4 className="mb-2 font-semibold text-foreground">
                Atomic Execution
              </h4>
              <p className="text-sm text-muted-foreground">
                x402 settlement ensures all-or-nothing execution. No partial failures.
              </p>
            </div>
            <div className="rounded-xl bg-card p-6 border border-border">
              <h4 className="mb-2 font-semibold text-foreground">
                Explainable AI
              </h4>
              <p className="text-sm text-muted-foreground">
                Understand exactly what the AI will do before you approve.
              </p>
            </div>
            <div className="rounded-xl bg-card p-6 border border-border">
              <h4 className="mb-2 font-semibold text-foreground">
                Scheduled Automation
              </h4>
              <p className="text-sm text-muted-foreground">
                Set it once. Your strategy runs weekly or on-demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border px-6 py-20 text-center md:px-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <h3 className="text-3xl font-bold text-foreground">
            Ready to try it?
          </h3>
          <p className="text-lg text-muted-foreground">
            Connect your wallet and start using Intent AI today.
          </p>
          <Link href="/app">
            <Button size="lg" className="gap-2">
              Launch App
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

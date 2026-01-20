'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Brain, Shield } from 'lucide-react';
import { CryptoTicker } from '@/components/crypto-ticker';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background">
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
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-5xl">
          <h3 className="mb-16 text-center text-3xl font-bold text-foreground">
            How It Works
          </h3>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-3 text-xl font-semibold text-foreground">
                Express Your Intent
              </h4>
              <p className="text-muted-foreground">
                Type what you want to do with your money in plain English. Save safely, invest aggressively, or rebalance weekly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h4 className="mb-3 text-xl font-semibold text-foreground">
                AI Generates Strategy
              </h4>
              <p className="text-muted-foreground">
                Our agent parses your intent, analyzes risk, and creates a clear execution plan with human-readable explanations.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-3 text-xl font-semibold text-foreground">
                Execute On-Chain
              </h4>
              <p className="text-muted-foreground">
                Review and approve. Your strategy executes atomically on Cronos EVM using x402 settlement flows.
              </p>
            </div>
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

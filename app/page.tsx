'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Brain, Shield } from 'lucide-react';
import { CryptoTicker } from '@/components/crypto-ticker';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
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
        <div className="absolute inset-0 bg-black/50"></div>
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

      {/* Rest of page with landbg.jpg background */}
      <div className="relative bg-cover bg-center bg-fixed bg-no-repeat" style={{ backgroundImage: 'url(/landbg.jpg)' }}>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/75"></div>
        
        {/* Shiny gradient overlay */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.1) 100%)'
          }}
        ></div>
        
        {/* Radial shine effects */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)'
          }}
        ></div>
        
        {/* Subtle glossy reflection */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.3) 100%)'
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-10">
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
                
                {/* Step 1 visual */}
                <div className="mb-6 relative h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="/step1.jpg"
                    alt="Express Your Intent"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent"></div>
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
                <div className="mb-6 relative h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="/loader.jpg"
                    alt="AI Processing"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent"></div>
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
                <div className="mb-6 relative h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="/onchain.jpg"
                    alt="On-Chain Execution"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent"></div>
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

      {/* Features - Timeline */}
      <section className="relative border-t border-border px-6 py-20 md:px-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent pointer-events-none"></div>
        
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center mb-20">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Why Intent AI
            </h3>
            <p className="text-lg text-white/90 drop-shadow-md">
              The future of DeFi, built for everyone
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary via-accent to-primary"></div>

            {/* Timeline Item 1 - RIGHT SIDE */}
            <div className="relative mb-16 group">
              <div className="flex items-start gap-8">
                {/* Empty space on left for desktop */}
                <div className="hidden md:block md:w-1/2"></div>
                
                {/* Timeline dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                    <div className="h-8 w-8 rounded-full bg-primary animate-pulse"></div>
                  </div>
                </div>

                {/* Content on right */}
                <div className="md:w-1/2 md:pl-12 pl-20">
                  <div className="space-y-2 transition-all duration-300 group-hover:scale-105">
                    <h4 className="text-2xl font-bold text-white drop-shadow-lg">
                      Natural Language Interface
                    </h4>
                    <p className="text-white/90 leading-relaxed drop-shadow-md">
                      No need to understand DeFi protocols. Describe your goals naturally and let our AI handle the complexity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Item 2 - LEFT SIDE */}
            <div className="relative mb-16 group">
              <div className="flex items-start gap-8">
                <div className="md:w-1/2 md:pr-12 pl-20 md:pl-0">
                  <div className="space-y-2 transition-all duration-300 group-hover:scale-105">
                    <h4 className="text-2xl font-bold text-white drop-shadow-lg">
                      Atomic Execution
                    </h4>
                    <p className="text-white/90 leading-relaxed drop-shadow-md">
                      x402 settlement ensures all-or-nothing execution. No partial failures, no unexpected outcomes.
                    </p>
                  </div>
                </div>
                
                {/* Timeline dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                    <div className="h-8 w-8 rounded-full bg-accent animate-pulse"></div>
                  </div>
                </div>

                <div className="hidden md:block md:w-1/2"></div>
              </div>
            </div>

            {/* Timeline Item 3 - RIGHT SIDE */}
            <div className="relative mb-16 group">
              <div className="flex items-start gap-8">
                {/* Empty space on left for desktop */}
                <div className="hidden md:block md:w-1/2"></div>
                
                {/* Timeline dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                    <div className="h-8 w-8 rounded-full bg-primary animate-pulse"></div>
                  </div>
                </div>

                {/* Content on right */}
                <div className="md:w-1/2 md:pl-12 pl-20">
                  <div className="space-y-2 transition-all duration-300 group-hover:scale-105">
                    <h4 className="text-2xl font-bold text-white drop-shadow-lg">
                      Explainable AI
                    </h4>
                    <p className="text-white/90 leading-relaxed drop-shadow-md">
                      Complete transparency. Understand exactly what the AI will do before you approve any transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Item 4 - LEFT SIDE */}
            <div className="relative group">
              <div className="flex items-start gap-8">
                <div className="md:w-1/2 md:pr-12 pl-20 md:pl-0">
                  <div className="space-y-2 transition-all duration-300 group-hover:scale-105">
                    <h4 className="text-2xl font-bold text-white drop-shadow-lg">
                      Scheduled Automation
                    </h4>
                    <p className="text-white/90 leading-relaxed drop-shadow-md">
                      Set it once and let it run. Your strategy executes weekly or on-demand, completely automated.
                    </p>
                  </div>
                </div>
                
                {/* Timeline dot */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                    <div className="h-8 w-8 rounded-full bg-accent animate-pulse"></div>
                  </div>
                </div>

                <div className="hidden md:block md:w-1/2"></div>
              </div>
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

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              {/* Brand Section */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-primary">Intent AI</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transform your financial intent into on-chain execution. The future of DeFi, powered by AI.
                </p>
              </div>

              {/* Product Links */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Product</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/app" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Launch App
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Features
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Resources</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Guides
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Community */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Community</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Discord
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Telegram
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Intent AI. All rights reserved.
                </p>
                <div className="flex gap-6">
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
        </div>
      </div>
    </main>
  );
}

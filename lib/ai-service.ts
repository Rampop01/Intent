import type { Strategy } from './app-context';

export function parseIntent(intent: string): Strategy {
  const lowerIntent = intent.toLowerCase();
  
  // Extract amount (looks for patterns like $100, 100 dollars, etc)
  const amountMatch = intent.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 500;

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (
    lowerIntent.includes('safe') ||
    lowerIntent.includes('conservative') ||
    lowerIntent.includes('protect') ||
    lowerIntent.includes('secure')
  ) {
    riskLevel = 'low';
  } else if (
    lowerIntent.includes('aggressive') ||
    lowerIntent.includes('growth') ||
    lowerIntent.includes('maximize') ||
    lowerIntent.includes('invest')
  ) {
    riskLevel = 'high';
  }

  // Determine allocation based on risk
  const allocation =
    riskLevel === 'low'
      ? { stable: 70, liquid: 25, growth: 5 }
      : riskLevel === 'high'
        ? { stable: 20, liquid: 30, growth: 50 }
        : { stable: 40, liquid: 35, growth: 25 };

  // Determine execution frequency
  const execution =
    lowerIntent.includes('weekly') || lowerIntent.includes('rebalance')
      ? 'weekly'
      : 'one-time';

  // Determine monitoring frequency
  let monitoring: 'daily' | 'weekly' | 'monthly' = 'weekly';
  if (lowerIntent.includes('daily') || lowerIntent.includes('watch')) {
    monitoring = 'daily';
  } else if (lowerIntent.includes('monthly')) {
    monitoring = 'monthly';
  }

  // Generate human-readable explanation
  const explanation = generateExplanation(
    amount,
    riskLevel,
    allocation,
    execution,
    monitoring
  );

  return {
    intent,
    amount: amount.toString(),
    riskLevel,
    allocation,
    execution: execution === 'one-time' ? 'once' as const : execution as 'weekly',
    monitoring,
    explanation,
  };
}

function generateExplanation(
  amount: number,
  riskLevel: string,
  allocation: { stable: number; liquid: number; growth: number },
  execution: string,
  monitoring: string
): string {
  const riskDescription =
    riskLevel === 'low'
      ? 'conservative, stability-focused approach'
      : riskLevel === 'high'
        ? 'growth-oriented strategy with higher risk exposure'
        : 'balanced approach between stability and growth';

  const executionDescription = execution === 'weekly' ? 'weekly rebalancing' : 'one-time deployment';

  const monitoringDescription =
    monitoring === 'daily'
      ? 'daily monitoring'
      : monitoring === 'monthly'
        ? 'monthly check-ins'
        : 'weekly reviews';

  return `I will deploy your $${amount} using a ${riskDescription}. Your funds will be allocated across:
• ${allocation.stable}% stable assets for security
• ${allocation.liquid}% liquid assets for flexibility
• ${allocation.growth}% growth assets for upside potential

This strategy will use ${executionDescription} and include ${monitoringDescription} to ensure alignment with your goals. All transactions will be executed atomically on Cronos EVM using x402 settlement flows to guarantee all-or-nothing execution.`;
}

export const PRESET_STRATEGIES: Record<string, Strategy> = {
  safe_save: {
    intent: 'Save $200 safely',
    amount: '200',
    riskLevel: 'low',
    allocation: {
      stable: 85,
      liquid: 15,
      growth: 0,
    },
    execution: 'once',
    monitoring: 'weekly',
    explanation:
      'I will place your $200 into stable, secure assets for capital preservation. Focus on safety and liquidity with minimal growth exposure. Weekly monitoring ensures everything stays on track.',
  },
  balanced_invest: {
    intent: 'Invest $500 with balanced risk',
    amount: '500',
    riskLevel: 'medium',
    allocation: {
      stable: 40,
      liquid: 35,
      growth: 25,
    },
    execution: 'weekly',
    monitoring: 'weekly',
    explanation:
      'I will deploy your $500 across a balanced portfolio with weekly rebalancing. This strategy allocates funds to stable assets (40%), liquid positions (35%), and growth opportunities (25%). Regular monitoring ensures your allocation stays optimized.',
  },
  aggressive_growth: {
    intent: 'Invest $1000 aggressively for growth',
    amount: '1000',
    riskLevel: 'high',
    allocation: {
      stable: 10,
      liquid: 20,
      growth: 70,
    },
    execution: 'weekly',
    monitoring: 'daily',
    explanation:
      'I will deploy your $1000 with an aggressive growth focus. Your capital will be primarily allocated to growth assets (70%) with liquid reserves (20%) and stable assets (10%) for downside protection. Daily monitoring tracks market conditions with weekly rebalancing.',
  },
};

import { generateText } from 'ai';

export interface ParsedIntent {
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  allocation: {
    stable: number;
    liquid: number;
    growth: number;
  };
  executionType: 'once' | 'weekly';
  monitoring: string;
  explanation: string;
}

/**
 * Parse user intent using OpenAI GPT
 * Converts natural language into a structured strategy
 */
export async function parseUserIntent(userIntent: string): Promise<ParsedIntent> {
  const prompt = `You are a financial AI agent. Parse the following user intent and extract:
1. Amount they want to invest (as a number, default to 500 if not specified)
2. Risk level (low, medium, or high based on context)
3. Asset allocation percentages (stable coins, liquid tokens, growth assets) - must sum to 100%
4. Execution type (once or weekly based on context)
5. Monitoring frequency (daily, weekly, monthly)
6. A clear explanation of the strategy

User intent: "${userIntent}"

Respond in this exact JSON format:
{
  "amount": <number>,
  "riskLevel": "<low|medium|high>",
  "allocation": {
    "stable": <0-100>,
    "liquid": <0-100>,
    "growth": <0-100>
  },
  "executionType": "<once|weekly>",
  "monitoring": "<daily|weekly|monthly>",
  "explanation": "<human-readable explanation of the strategy>"
}`;

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (
      !parsed.amount ||
      !parsed.riskLevel ||
      !parsed.allocation ||
      !parsed.executionType ||
      !parsed.monitoring ||
      !parsed.explanation
    ) {
      throw new Error('Incomplete AI response');
    }

    // Validate allocations sum to 100
    const allocationSum =
      parsed.allocation.stable +
      parsed.allocation.liquid +
      parsed.allocation.growth;

    if (allocationSum !== 100) {
      // Normalize if not exactly 100
      const factor = 100 / allocationSum;
      parsed.allocation.stable = Math.round(parsed.allocation.stable * factor);
      parsed.allocation.liquid = Math.round(parsed.allocation.liquid * factor);
      parsed.allocation.growth = Math.round(parsed.allocation.growth * factor);

      // Adjust rounding
      const difference =
        100 -
        (parsed.allocation.stable +
          parsed.allocation.liquid +
          parsed.allocation.growth);
      parsed.allocation.growth += difference;
    }

    return {
      amount: Number(parsed.amount),
      riskLevel: parsed.riskLevel,
      allocation: {
        stable: parsed.allocation.stable,
        liquid: parsed.allocation.liquid,
        growth: parsed.allocation.growth,
      },
      executionType: parsed.executionType,
      monitoring: parsed.monitoring,
      explanation: parsed.explanation,
    };
  } catch (error) {
    console.error('[v0] AI parsing error:', error);
    throw new Error('Failed to parse intent with AI');
  }
}

/**
 * Generate a human-readable strategy summary
 */
export async function generateStrategySummary(intent: ParsedIntent): Promise<string> {
  const prompt = `Create a brief, compelling summary of this investment strategy:
- Amount: $${intent.amount}
- Risk Level: ${intent.riskLevel}
- Allocation: ${intent.allocation.stable}% stable, ${intent.allocation.liquid}% liquid, ${intent.allocation.growth}% growth
- Execution: ${intent.executionType === 'once' ? 'One-time' : 'Weekly'}
- Monitoring: ${intent.monitoring}

Make it sound professional and reassuring. Keep it to 2-3 sentences.`;

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 200,
    });

    return text.trim();
  } catch (error) {
    console.error('[v0] Summary generation error:', error);
    return intent.explanation;
  }
}

import { parseUserIntent } from '@/lib/ai-real-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { intent } = await request.json();

    if (!intent || typeof intent !== 'string') {
      return NextResponse.json(
        { error: 'Invalid intent provided' },
        { status: 400 }
      );
    }

    console.log('[API] Parsing user intent:', intent);

    // Set a timeout for the AI parsing
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI parsing timeout')), 25000)
    );

    const parsePromise = parseUserIntent(intent);

    try {
      const parsedIntent = await Promise.race([parsePromise, timeout]);
      console.log('[API] Successfully parsed intent:', parsedIntent);
      return NextResponse.json(parsedIntent);
    } catch (aiError) {
      console.error('[API] AI parsing failed, using fallback:', aiError);
      
      // Fallback parsing
      const fallbackResult = fallbackParseIntent(intent);
      console.log('[API] Fallback parsing result:', fallbackResult);
      return NextResponse.json(fallbackResult);
    }
  } catch (error) {
    console.error('[API] Error in parse-intent route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to parse intent',
      },
      { status: 500 }
    );
  }
}

// Simple fallback parser when AI service fails
function fallbackParseIntent(intent: string) {
  const text = intent.toLowerCase();
  
  // Extract amount
  const amountMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 500;
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (text.includes('safe') || text.includes('conservative') || text.includes('minimal risk') || text.includes('low risk')) {
    riskLevel = 'low';
  } else if (text.includes('aggressive') || text.includes('risky') || text.includes('high risk') || text.includes('maximum')) {
    riskLevel = 'high';
  }
  
  // Determine execution type
  let executionType: 'once' | 'weekly' | 'daily' | 'monthly' = 'once';
  if (text.includes('weekly')) executionType = 'weekly';
  else if (text.includes('daily')) executionType = 'daily';
  else if (text.includes('monthly')) executionType = 'monthly';
  
  // Set allocations based on risk level
  let allocation;
  switch (riskLevel) {
    case 'low':
      allocation = { stable: 70, liquid: 20, growth: 10 };
      break;
    case 'high':
      allocation = { stable: 20, liquid: 30, growth: 50 };
      break;
    default:
      allocation = { stable: 40, liquid: 30, growth: 30 };
  }
  
  return {
    amount,
    riskLevel,
    allocation,
    executionType,
    monitoring: riskLevel === 'high' ? 'daily' : riskLevel === 'low' ? 'monthly' : 'weekly',
    explanation: `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} risk strategy with ${allocation.stable}% stablecoins, ${allocation.liquid}% liquid tokens, and ${allocation.growth}% growth assets.`
  };
}

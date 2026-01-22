import { NextRequest, NextResponse } from 'next/server';
import { x402Client } from '@/lib/x402-payment-client';

export async function POST(request: NextRequest) {
  try {
    const { userAddress, feature, endpoint } = await request.json();

    if (!userAddress || !feature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if payment is required for this feature
    const paymentInfo = await x402Client.checkPaymentRequired(endpoint || `/api/${feature}`);
    
    if (!paymentInfo) {
      return NextResponse.json({
        paymentRequired: false,
        message: 'No payment required'
      });
    }

    // Check user's current tier
    const userTier = await x402Client.getUserTier(userAddress);
    
    // If user has premium subscription and credits, no payment needed
    if (userTier.tier === 'premium' && userTier.features[feature as keyof typeof userTier.features]) {
      const hasCredits = await x402Client.consumeCredit(userAddress, feature as any);
      if (hasCredits) {
        return NextResponse.json({
          paymentRequired: false,
          message: 'Premium subscription covers this feature',
          userTier: await x402Client.getUserTier(userAddress)
        });
      }
    }

    // Return payment requirements
    return NextResponse.json({
      paymentRequired: true,
      paymentInfo,
      userTier,
      options: {
        oneTime: {
          price: `$${(parseInt(paymentInfo.amount) / 100).toFixed(2)}`,
          description: paymentInfo.description
        },
        subscription: {
          price: '$9.99/month',
          description: 'Unlimited premium features + MEV protection',
          features: [
            'Unlimited premium AI analysis',
            'MEV protection for all transactions',
            'Cross-chain optimization',
            'Priority support',
            'Advanced risk analytics'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Payment check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Process payment
export async function PUT(request: NextRequest) {
  try {
    const { paymentInfo, paymentMethod } = await request.json();

    if (!paymentInfo) {
      return NextResponse.json(
        { error: 'Missing payment info' },
        { status: 400 }
      );
    }

    const result = await x402Client.makePayment(paymentInfo);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      receipt: result.receipt,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// Upgrade to premium subscription
export async function PATCH(request: NextRequest) {
  try {
    const { userAddress } = await request.json();

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Missing user address' },
        { status: 400 }
      );
    }

    // In a real implementation, this would process subscription payment
    const success = await x402Client.upgradeToPremium(userAddress);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to upgrade subscription' },
        { status: 500 }
      );
    }

    const updatedTier = await x402Client.getUserTier(userAddress);

    return NextResponse.json({
      success: true,
      userTier: updatedTier,
      message: 'Successfully upgraded to premium'
    });

  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return NextResponse.json(
      { error: 'Subscription upgrade failed' },
      { status: 500 }
    );
  }
}
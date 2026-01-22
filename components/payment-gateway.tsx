'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Star, Zap, Shield, Globe } from 'lucide-react';
import type { UserTier, PaymentInfo } from '@/lib/x402-payment-client';

interface PaymentGatewayProps {
  userAddress: string;
  feature: string;
  onPaymentSuccess: (receipt: string) => void;
  onCancel: () => void;
}

interface PaymentOption {
  type: 'oneTime' | 'subscription';
  price: string;
  description: string;
  features?: string[];
}

export default function PaymentGateway({ 
  userAddress, 
  feature, 
  onPaymentSuccess, 
  onCancel 
}: PaymentGatewayProps) {
  const [userTier, setUserTier] = useState<UserTier | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [options, setOptions] = useState<{ oneTime: PaymentOption; subscription: PaymentOption } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'oneTime' | 'subscription'>('oneTime');

  React.useEffect(() => {
    checkPaymentRequirements();
  }, [userAddress, feature]);

  const checkPaymentRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/x402-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, feature })
      });

      const data = await response.json();
      
      if (!data.paymentRequired) {
        onPaymentSuccess('no-payment-needed');
        return;
      }

      setUserTier(data.userTier);
      setPaymentInfo(data.paymentInfo);
      setOptions(data.options);
    } catch (err) {
      setError('Failed to check payment requirements');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!paymentInfo) return;

    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (selectedOption === 'subscription') {
        // Process subscription upgrade
        response = await fetch('/api/x402-payment', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAddress })
        });
      } else {
        // Process one-time payment
        response = await fetch('/api/x402-payment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paymentInfo,
            paymentMethod: 'crypto' 
          })
        });
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      onPaymentSuccess(result.receipt || result.transactionHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !options) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Checking payment requirements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Premium Feature Access
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose how you'd like to access premium features
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {userTier && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Current Tier</p>
              <Badge variant={userTier.tier === 'premium' ? 'default' : 'secondary'}>
                {userTier.tier}
              </Badge>
            </div>
            {userTier.remainingCredits !== undefined && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Remaining Credits</p>
                <p className="font-medium">{userTier.remainingCredits}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {options && (
          <div className="space-y-4">
            {/* One-time payment option */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedOption === 'oneTime' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('oneTime')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Pay Once</h3>
                  <p className="text-sm text-gray-600">{options.oneTime.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{options.oneTime.price}</p>
                  <p className="text-xs text-gray-500">One-time</p>
                </div>
              </div>
            </div>

            {/* Subscription option */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedOption === 'subscription' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('subscription')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    Premium Subscription
                    <Star className="h-4 w-4 text-yellow-500" />
                  </h3>
                  <p className="text-sm text-gray-600">{options.subscription.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{options.subscription.price}</p>
                  <p className="text-xs text-gray-500">Monthly</p>
                </div>
              </div>
              
              {selectedOption === 'subscription' && options.subscription.features && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium mb-2">Premium Features:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {options.subscription.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedOption === 'subscription' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Premium Benefits</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Unlimited premium features</li>
                  <li>• MEV protection saves $5-15 per transaction</li>
                  <li>• Advanced risk analytics and insights</li>
                  <li>• Priority customer support</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Shield className="h-4 w-4" />
          <span>Secure payment processing via x402 protocol</span>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={processPayment}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                {selectedOption === 'subscription' ? 'Subscribe' : 'Pay Now'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
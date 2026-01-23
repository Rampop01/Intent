'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Sidebar } from '@/components/sidebar';
import { WalletConnect } from '@/components/wallet-connect';
import { WalletConnectCompact } from '@/components/wallet-connect-compact';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  AlertTriangle,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Key,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  strategyExecution: boolean;
  weeklyReports: boolean;
  priceAlerts: boolean;
  securityAlerts: boolean;
}

interface GeneralSettings {
  defaultRiskLevel: 'low' | 'medium' | 'high';
  defaultExecutionType: 'once' | 'weekly' | 'daily' | 'monthly';
  currency: 'USD' | 'EUR' | 'GBP';
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  showBalances: boolean;
}

export default function SettingsPage() {
  const { walletConnected, walletAddress, disconnectWallet } = useApp();

  // Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    strategyExecution: true,
    weeklyReports: true,
    priceAlerts: false,
    securityAlerts: true,
  });

  const [general, setGeneral] = useState<GeneralSettings>({
    defaultRiskLevel: 'medium',
    defaultExecutionType: 'weekly',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    biometricEnabled: true,
    sessionTimeout: 30,
    showBalances: true,
  });

  const [emailNotifications, setEmailNotifications] = useState('user@example.com');
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasChanges(false);
    setIsSaving(false);
    // Show success toast in real app
  };

  const handleReset = () => {
    // Reset to default values
    setHasChanges(false);
  };

  const handleResetPortfolioData = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('This will IMMEDIATELY clear ALL cached data including the $1,806 amounts you are seeing. Continue?');
      if (confirmed) {
        // Nuclear option - clear ALL storage that could contain mock data
        const allKeys = Object.keys(localStorage);
        let removedCount = 0;
        
        allKeys.forEach(key => {
          if (key.startsWith('intent_') || 
              key.includes('strategy') || 
              key.includes('portfolio') || 
              key.includes('activity') ||
              key.includes('1800') ||
              key.includes('1806') ||
              key.includes('exec_') ||
              key.includes('strategy_00')) {
            localStorage.removeItem(key);
            removedCount++;
          }
        });
        
        // Also force clear specific problematic values
        ['intent_portfolio_data', 'intent_activity_log', 'intent_saved_strategies', 'intent_user_balances'].forEach(key => {
          localStorage.removeItem(key);
        });
        
        console.log(`[Settings] Removed ${removedCount} localStorage entries`);
        alert(`Cleared ${removedCount} cached data entries. The $1,806 values should now be gone!`);
        
        // Force immediate refresh
        window.location.reload();
      }
    }
  };

  const exportSettings = () => {
    const settings = { notifications, general, security };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intent-ai-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        setNotifications(settings.notifications || notifications);
        setGeneral(settings.general || general);
        setSecurity(settings.security || security);
        setHasChanges(true);
      } catch (error) {
        console.error('Error importing settings:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleEmergencyStop = async () => {
    if (confirm('Are you sure you want to pause ALL strategies? This action will stop all automated executions.')) {
      // Implement emergency stop logic
      console.log('Emergency stop activated');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implement account deletion logic
      console.log('Account deletion requested');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onLogout={disconnectWallet} walletAddress={walletAddress || undefined} />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-6 py-8 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-foreground">Settings</h1>
              <p className="text-lg text-muted-foreground">Manage your preferences and account settings</p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
              {walletConnected && (
                <div className="hidden md:block">
                  <WalletConnectCompact />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          {!walletConnected ? (
            <div className="text-center space-y-6 py-16">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Connect Your Wallet</h2>
                <p className="text-muted-foreground">Connect to access your settings</p>
              </div>
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="backup">Backup</TabsTrigger>
                  <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        General Preferences
                      </CardTitle>
                      <CardDescription>
                        Configure your default settings for strategies and interface
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Default Risk Level</Label>
                          <Select 
                            value={general.defaultRiskLevel} 
                            onValueChange={(value) => {
                              setGeneral(prev => ({ ...prev, defaultRiskLevel: value as any }));
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low Risk</SelectItem>
                              <SelectItem value="medium">Medium Risk</SelectItem>
                              <SelectItem value="high">High Risk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Default Execution Type</Label>
                          <Select 
                            value={general.defaultExecutionType}
                            onValueChange={(value) => {
                              setGeneral(prev => ({ ...prev, defaultExecutionType: value as any }));
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">One-time</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select 
                            value={general.currency}
                            onValueChange={(value) => {
                              setGeneral(prev => ({ ...prev, currency: value as any }));
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Language</Label>
                          <Select 
                            value={general.language}
                            onValueChange={(value) => {
                              setGeneral(prev => ({ ...prev, language: value as any }));
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="de">Deutsch</SelectItem>
                              <SelectItem value="zh">中文</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Settings
                      </CardTitle>
                      <CardDescription>
                        Control how and when you receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input 
                              type="email" 
                              value={emailNotifications} 
                              onChange={(e) => {
                                setEmailNotifications(e.target.value);
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input 
                              type="tel" 
                              value={phoneNumber} 
                              onChange={(e) => {
                                setPhoneNumber(e.target.value);
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Notification Channels */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Notification Channels</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                            </div>
                            <Switch 
                              checked={notifications.email}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => ({ ...prev, email: checked }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Push Notifications</p>
                              <p className="text-sm text-muted-foreground">Browser push notifications</p>
                            </div>
                            <Switch 
                              checked={notifications.push}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => ({ ...prev, push: checked }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">SMS Notifications</p>
                              <p className="text-sm text-muted-foreground">Text message alerts</p>
                            </div>
                            <Switch 
                              checked={notifications.sms}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => ({ ...prev, sms: checked }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Notification Types */}
                      <div className="space-y-4">
                        <h4 className="font-medium">What to Notify Me About</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Strategy Executions</p>
                              <p className="text-sm text-muted-foreground">When strategies are executed or rebalanced</p>
                            </div>
                            <Switch 
                              checked={notifications.strategyExecution}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => ({ ...prev, strategyExecution: checked }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Weekly Reports</p>
                              <p className="text-sm text-muted-foreground">Portfolio performance summaries</p>
                            </div>
                            <Switch 
                              checked={notifications.weeklyReports}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => ({ ...prev, weeklyReports: checked }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Price Alerts</p>
                              <p className="text-sm text-muted-foreground">Significant price movements</p>
                            </div>
                            <Switch 
                              checked={notifications.priceAlerts}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => ({ ...prev, priceAlerts: checked }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Security Alerts</p>
                              <p className="text-sm text-muted-foreground">Login attempts and security events</p>
                            </div>
                            <Switch 
                              checked={notifications.securityAlerts}
                              onCheckedChange={(checked) => {
                                setNotifications(prev => ({ ...prev, securityAlerts: checked }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Settings
                      </CardTitle>
                      <CardDescription>
                        Manage your account security and privacy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">Extra security for your account</p>
                          </div>
                          <Switch 
                            checked={security.twoFactorEnabled}
                            onCheckedChange={(checked) => {
                              setSecurity(prev => ({ ...prev, twoFactorEnabled: checked }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Biometric Authentication</p>
                            <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
                          </div>
                          <Switch 
                            checked={security.biometricEnabled}
                            onCheckedChange={(checked) => {
                              setSecurity(prev => ({ ...prev, biometricEnabled: checked }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Show Portfolio Balances</p>
                            <p className="text-sm text-muted-foreground">Display actual amounts in interface</p>
                          </div>
                          <Switch 
                            checked={security.showBalances}
                            onCheckedChange={(checked) => {
                              setSecurity(prev => ({ ...prev, showBalances: checked }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Session Management</h4>
                        <div className="space-y-2">
                          <Label>Session Timeout (minutes)</Label>
                          <Select 
                            value={security.sessionTimeout.toString()}
                            onValueChange={(value) => {
                              setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(value) }));
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="0">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Data Management
                      </CardTitle>
                      <CardDescription>
                        Reset or clear application data (for testing purposes)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Clear $1,806 Mock Data</p>
                          <p className="text-sm text-muted-foreground">Remove the fake $1,806 invested amounts and show only real data</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleResetPortfolioData}>
                          Clear Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Backup */}
                <TabsContent value="backup" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Backup & Import
                      </CardTitle>
                      <CardDescription>
                        Export your settings or import from another device
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Export Settings</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Download your current settings as a backup file
                          </p>
                          <Button onClick={exportSettings} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Settings
                          </Button>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium mb-2">Import Settings</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload a settings file from another device
                          </p>
                          <div>
                            <input
                              type="file"
                              accept=".json"
                              onChange={importSettings}
                              className="hidden"
                              id="import-settings"
                            />
                            <Button variant="outline" asChild className="gap-2">
                              <label htmlFor="import-settings" className="cursor-pointer">
                                <Upload className="h-4 w-4" />
                                Import Settings
                              </label>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Danger Zone */}
                <TabsContent value="danger" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>
                        Irreversible actions that affect your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          These actions are permanent and cannot be undone. Please proceed with caution.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div className="border border-orange-200 rounded-lg p-4">
                          <h4 className="font-medium text-orange-800 mb-2">Emergency Stop All Strategies</h4>
                          <p className="text-sm text-orange-600 mb-4">
                            Immediately pause all active strategies and stop automated executions.
                          </p>
                          <Button variant="outline" onClick={handleEmergencyStop} className="border-orange-300 text-orange-700 hover:bg-orange-50">
                            Emergency Stop
                          </Button>
                        </div>

                        <div className="border border-red-200 rounded-lg p-4">
                          <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                          <p className="text-sm text-red-600 mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <Button variant="destructive" onClick={handleDeleteAccount}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
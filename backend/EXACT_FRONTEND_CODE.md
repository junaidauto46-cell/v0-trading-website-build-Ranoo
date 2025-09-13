# Exact Frontend Code Examples for CryptoHaven Integration

## 🔐 JWT Security Best Practices

### Recommended Approach: HttpOnly Cookies + Access Token in Memory

For maximum security, use this hybrid approach:

**Why HttpOnly Cookies are Better:**
- Cannot be accessed by JavaScript (XSS protection)
- Automatically sent with requests
- More secure than localStorage
- Better for refresh tokens

**Implementation:**

```typescript
// lib/auth-service.ts
class AuthService {
  private accessToken: string | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    // Store refresh token in httpOnly cookie via API call
    document.cookie = `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/`;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        return data.accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return null;
  }
}

export const authService = new AuthService();
```

## 📝 Complete Page Examples

### 1. Registration Page (`app/(auth)/register/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface PasswordRequirement {
  met: boolean;
  text: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { met: false, text: 'At least 8 characters' },
    { met: false, text: 'One uppercase letter' },
    { met: false, text: 'One lowercase letter' },
    { met: false, text: 'One number' },
    { met: false, text: 'One special character' },
  ]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  const validatePassword = (password: string) => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /\d/.test(password), text: 'One number' },
      { met: /[@$!%*?&]/.test(password), text: 'One special character' },
    ];
    setPasswordRequirements(requirements);
    return requirements.every(req => req.met);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    validatePassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!validatePassword(formData.password)) {
      setError('Please meet all password requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens securely
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join CryptoHaven and start your trading journey
          </CardDescription>
          {referralCode && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                Joining with referral code: <strong>{referralCode}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password Requirements */}
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {req.met ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => router.push('/login')}>
                Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Login Page (`app/(auth)/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens and user data
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Redirect based on user role
        if (data.data.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your CryptoHaven account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="link"
                className="p-0 text-sm"
                onClick={() => router.push('/forgot-password')}
              >
                Forgot password?
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => router.push('/register')}>
                Create account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Deposit Page (`app/dashboard/deposits/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Plus, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface Deposit {
  id: string;
  txid: string;
  chain: string;
  amount_usd: string;
  coin: string;
  note?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes?: string;
  created_at: string;
  approved_at?: string;
}

interface DepositAddresses {
  USDT: {
    ERC20: { address: string; network: string; minDeposit: number };
    TRC20: { address: string; network: string; minDeposit: number };
  };
  BTC: { address: string; network: string; minDeposit: number };
  ETH: { address: string; network: string; minDeposit: number };
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [addresses, setAddresses] = useState<DepositAddresses | null>(null);
  const [activeTab, setActiveTab] = useState('deposit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [depositForm, setDepositForm] = useState({
    txid: '',
    chain: 'ERC20',
    amount_usd: '',
    coin: 'USDT',
    note: '',
  });

  useEffect(() => {
    loadDeposits();
    loadAddresses();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadDeposits = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deposits`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setDeposits(data.data.deposits);
      }
    } catch (error) {
      console.error('Failed to load deposits:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deposits/addresses`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.data.addresses);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Address copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deposits`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          txid: depositForm.txid,
          chain: depositForm.chain,
          amount_usd: parseFloat(depositForm.amount_usd),
          coin: depositForm.coin,
          note: depositForm.note || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Deposit request submitted successfully! It will be reviewed by our team.');
        setDepositForm({
          txid: '',
          chain: 'ERC20',
          amount_usd: '',
          coin: 'USDT',
          note: '',
        });
        setActiveTab('history');
        loadDeposits();
      } else {
        setError(data.message || 'Failed to submit deposit');
      }
    } catch (error: any) {
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deposits</h1>
        <p className="text-gray-600">Fund your account to start trading</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Make Deposit</TabsTrigger>
          <TabsTrigger value="history">Deposit History</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-6">
          {/* Deposit Addresses */}
          {addresses && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Deposit Addresses</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(addresses).map(([coin, addressData]) => (
                  <div key={coin} className="space-y-2">
                    <h3 className="font-semibold text-lg">{coin}</h3>
                    {typeof addressData === 'object' && 'ERC20' in addressData ? (
                      <div className="grid gap-3">
                        {Object.entries(addressData).map(([network, details]) => (
                          <div key={network} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{details.network}</p>
                              <p className="text-sm text-gray-600 font-mono break-all">
                                {details.address}
                              </p>
                              <p className="text-xs text-gray-500">
                                Min: ${details.minDeposit}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(details.address)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{addressData.network}</p>
                          <p className="text-sm text-gray-600 font-mono break-all">
                            {addressData.address}
                          </p>
                          <p className="text-xs text-gray-500">
                            Min: {addressData.minDeposit} {coin}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(addressData.address)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Deposit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Submit Deposit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coin">Cryptocurrency</Label>
                    <Select value={depositForm.coin} onValueChange={(value) => 
                      setDepositForm({ ...depositForm, coin: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select coin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDT">USDT (Tether)</SelectItem>
                        <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                        <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chain">Network</Label>
                    <Select value={depositForm.chain} onValueChange={(value) => 
                      setDepositForm({ ...depositForm, chain: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ERC20">Ethereum (ERC20)</SelectItem>
                        <SelectItem value="TRC20">Tron (TRC20)</SelectItem>
                        <SelectItem value="BTC">Bitcoin Network</SelectItem>
                        <SelectItem value="ETH">Ethereum Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="10"
                    placeholder="Enter amount in USD"
                    value={depositForm.amount_usd}
                    onChange={(e) => setDepositForm({ ...depositForm, amount_usd: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">Minimum deposit: $10</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txid">Transaction ID</Label>
                  <Input
                    id="txid"
                    type="text"
                    placeholder="Enter transaction hash/ID"
                    value={depositForm.txid}
                    onChange={(e) => setDepositForm({ ...depositForm, txid: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    The transaction hash from your wallet or exchange
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Additional information about this deposit"
                    value={depositForm.note}
                    onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Submit Deposit</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {deposits.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No deposits found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('deposit')}
                >
                  Make Your First Deposit
                </Button>
              </CardContent>
            </Card>
          ) : (
            deposits.map((deposit) => (
              <Card key={deposit.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(deposit.status)}
                      <div>
                        <h3 className="font-semibold">
                          {deposit.coin} via {deposit.chain}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(deposit.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(deposit.status)}>
                      {deposit.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold text-lg">${deposit.amount_usd}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transaction ID</p>
                      <p className="font-mono text-sm break-all">
                        {deposit.txid.length > 20 
                          ? `${deposit.txid.substring(0, 10)}...${deposit.txid.substring(deposit.txid.length - 10)}`
                          : deposit.txid
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Network</p>
                      <p className="font-semibold">{deposit.chain}</p>
                    </div>
                  </div>

                  {deposit.note && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        <strong>Your Note:</strong> {deposit.note}
                      </p>
                    </div>
                  )}

                  {deposit.admin_notes && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm">
                        <strong>Admin Notes:</strong> {deposit.admin_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4. Withdrawal Page (`app/dashboard/withdrawals/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, XCircle, AlertCircle, Wallet, Users, DollarSign } from 'lucide-react';

interface Withdrawal {
  id: string;
  amount_usd: string;
  destination_wallet: string;
  coin: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  admin_notes?: string;
  created_at: string;
  approved_at?: string;
}

interface EligibilityData {
  isEligible: boolean;
  currentBalance: number;
  minWithdrawalAmount: number;
  referralRequirement: {
    current: number;
    required: number;
    met: boolean;
  };
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [activeTab, setActiveTab] = useState('withdraw');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount_usd: '',
    destination_wallet: '',
    coin: 'USDT',
  });

  useEffect(() => {
    loadWithdrawals();
    checkEligibility();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadWithdrawals = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/withdrawals`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setWithdrawals(data.data.withdrawals);
      }
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
    }
  };

  const checkEligibility = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/withdrawals/eligibility`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setEligibility(data.data);
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!eligibility?.isEligible) {
      setError('You are not eligible for withdrawals yet. Please check the requirements.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/withdrawals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount_usd: parseFloat(withdrawalForm.amount_usd),
          destination_wallet: withdrawalForm.destination_wallet,
          coin: withdrawalForm.coin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Withdrawal request submitted successfully! It will be reviewed by our team.');
        setWithdrawalForm({
          amount_usd: '',
          destination_wallet: '',
          coin: 'USDT',
        });
        setActiveTab('history');
        loadWithdrawals();
        checkEligibility(); // Refresh eligibility data
      } else {
        setError(data.message || 'Failed to submit withdrawal');
      }
    } catch (error: any) {
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'PAID': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Withdrawals</h1>
        <p className="text-gray-600">Withdraw your funds to your wallet</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="withdraw">Request Withdrawal</TabsTrigger>
          <TabsTrigger value="history">Withdrawal History</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="space-y-6">
          {/* Eligibility Status */}
          {eligibility && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Withdrawal Eligibility</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Available Balance</p>
                      <p className="text-lg font-bold">${eligibility.currentBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <Users className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Active Referrals</p>
                      <p className="text-lg font-bold">
                        {eligibility.referralRequirement.current}/{eligibility.referralRequirement.required}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                    <Wallet className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Min Withdrawal</p>
                      <p className="text-lg font-bold">${eligibility.minWithdrawalAmount}</p>
                    </div>
                  </div>
                </div>

                {!eligibility.isEligible && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-orange-700">
                      <strong>Withdrawal Requirements Not Met:</strong>
                      <br />
                      You need {eligibility.referralRequirement.required} referred users who have each completed at least one approved deposit. 
                      Currently you have {eligibility.referralRequirement.current} active referrals.
                    </AlertDescription>
                  </Alert>
                )}

                {eligibility.isEligible && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-700">
                      <strong>You're eligible for withdrawals!</strong> All requirements have been met.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coin">Cryptocurrency</Label>
                    <Select value={withdrawalForm.coin} onValueChange={(value) => 
                      setWithdrawalForm({ ...withdrawalForm, coin: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select coin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDT">USDT (Tether)</SelectItem>
                        <SelectItem value="BTC">BTC (Bitcoin)</SelectItem>
                        <SelectItem value="ETH">ETH (Ethereum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min={eligibility?.minWithdrawalAmount || 10}
                      max={eligibility?.currentBalance || 0}
                      placeholder="Enter withdrawal amount"
                      value={withdrawalForm.amount_usd}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount_usd: e.target.value })}
                      required
                      disabled={loading || !eligibility?.isEligible}
                    />
                    {eligibility && (
                      <p className="text-xs text-gray-500">
                        Available: ${eligibility.currentBalance.toFixed(2)} | 
                        Min: ${eligibility.minWithdrawalAmount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet">Destination Wallet Address</Label>
                  <Input
                    id="wallet"
                    type="text"
                    placeholder="Enter your wallet address"
                    value={withdrawalForm.destination_wallet}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, destination_wallet: e.target.value })}
                    required
                    disabled={loading || !eligibility?.isEligible}
                  />
                  <p className="text-xs text-gray-500">
                    Make sure this is the correct wallet address for {withdrawalForm.coin}
                  </p>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-700">
                    <strong>Important:</strong> Withdrawals are processed manually by our team. 
                    Please double-check your wallet address as transactions cannot be reversed.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !eligibility?.isEligible}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : eligibility?.isEligible ? (
                    'Submit Withdrawal Request'
                  ) : (
                    'Requirements Not Met'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {withdrawals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No withdrawals found</p>
                {eligibility?.isEligible && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('withdraw')}
                  >
                    Make Your First Withdrawal
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            withdrawals.map((withdrawal) => (
              <Card key={withdrawal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(withdrawal.status)}
                      <div>
                        <h3 className="font-semibold">
                          {withdrawal.coin} Withdrawal
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(withdrawal.status)}>
                      {withdrawal.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold text-lg">${withdrawal.amount_usd}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Destination</p>
                      <p className="font-mono text-sm break-all">
                        {withdrawal.destination_wallet.length > 20 
                          ? `${withdrawal.destination_wallet.substring(0, 10)}...${withdrawal.destination_wallet.substring(withdrawal.destination_wallet.length - 10)}`
                          : withdrawal.destination_wallet
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Currency</p>
                      <p className="font-semibold">{withdrawal.coin}</p>
                    </div>
                  </div>

                  {withdrawal.admin_notes && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm">
                        <strong>Admin Notes:</strong> {withdrawal.admin_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 5. Admin Panel Example (`app/admin/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Eye,
  AlertCircle 
} from 'lucide-react';

interface DashboardStats {
  overview: {
    total_users: number;
    new_users_last_30_days: number;
    total_deposits: { count: number; amount: number };
    total_withdrawals: { count: number; amount: number };
    total_invested: { count: number; amount: number };
    total_commissions: { count: number; amount: number };
    active_investments: number;
  };
  pending: {
    deposits: number;
    withdrawals: number;
  };
  recent_activities: {
    deposits: any[];
    withdrawals: any[];
  };
}

interface Deposit {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    referral_code: string;
  };
  txid: string;
  chain: string;
  amount_usd: string;
  coin: string;
  note?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');

  useEffect(() => {
    loadDashboardStats();
    loadDeposits();
  }, [statusFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const loadDeposits = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('limit', '20');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deposits?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      
      if (data.success) {
        setDeposits(data.data.deposits);
      }
    } catch (error) {
      console.error('Failed to load deposits:', error);
    }
  };

  const handleApprove = async (depositId: string) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deposits/${depositId}/approve`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            admin_notes: adminNotes || undefined,
            approved_amount: approvedAmount ? parseFloat(approvedAmount) : undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Deposit approved successfully!');
        setSelectedDeposit(null);
        setAdminNotes('');
        setApprovedAmount('');
        loadDeposits();
        loadDashboardStats();
      } else {
        setError(data.message || 'Failed to approve deposit');
      }
    } catch (error: any) {
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (depositId: string) => {
    if (!adminNotes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deposits/${depositId}/reject`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            admin_notes: adminNotes,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('Deposit rejected successfully!');
        setSelectedDeposit(null);
        setAdminNotes('');
        loadDeposits();
        loadDashboardStats();
      } else {
        setError(data.message || 'Failed to reject deposit');
      }
    } catch (error: any) {
      setError(error.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage platform operations and user requests</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.total_users}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.new_users_last_30_days} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.overview.total_deposits.amount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.total_deposits.count} deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-yellow-500" />
              Pending Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending.deposits}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-red-500" />
              Pending Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.pending.withdrawals}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deposits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deposits">Manage Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Manage Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search by user name, email, or transaction ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('PENDING')}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('APPROVED')}
                  >
                    Approved
                  </Button>
                  <Button
                    variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('REJECTED')}
                  >
                    Rejected
                  </Button>
                </div>
                <Button onClick={loadDeposits} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deposits List */}
          <div className="space-y-4">
            {deposits.map((deposit) => (
              <Card key={deposit.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {deposit.coin} via {deposit.chain}
                      </h3>
                      <p className="text-sm text-gray-600">
                        User: {deposit.user.name} ({deposit.user.email})
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(deposit.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(deposit.status)}>
                      {deposit.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-semibold text-lg">${deposit.amount_usd}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transaction ID</p>
                      <p className="font-mono text-sm break-all">
                        {deposit.txid.length > 20 
                          ? `${deposit.txid.substring(0, 15)}...`
                          : deposit.txid
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Network</p>
                      <p className="font-semibold">{deposit.chain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Referral Code</p>
                      <p className="font-semibold">{deposit.user.referral_code}</p>
                    </div>
                  </div>

                  {deposit.note && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        <strong>User Note:</strong> {deposit.note}
                      </p>
                    </div>
                  )}

                  {deposit.admin_notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm">
                        <strong>Admin Notes:</strong> {deposit.admin_notes}
                      </p>
                    </div>
                  )}

                  {deposit.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedDeposit(deposit)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {deposits.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No deposits found matching your criteria</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Deposit - {selectedDeposit.coin} {selectedDeposit.chain}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-semibold">{selectedDeposit.user.name}</p>
                  <p className="text-sm text-gray-500">{selectedDeposit.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-lg">${selectedDeposit.amount_usd}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
                  {selectedDeposit.txid}
                </p>
              </div>

              {selectedDeposit.note && (
                <div>
                  <p className="text-sm text-gray-600">User Note</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedDeposit.note}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="approvedAmount">Approved Amount (Optional)</Label>
                <Input
                  id="approvedAmount"
                  type="number"
                  step="0.01"
                  placeholder={`Default: $${selectedDeposit.amount_usd}`}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to approve the original amount
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add notes about this decision (required for rejection)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(selectedDeposit.id)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </div>
                  )}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedDeposit.id)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </div>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDeposit(null);
                    setAdminNotes('');
                    setApprovedAmount('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

## 🔒 JWT Security Implementation

### Secure Token Storage (Recommended)

```typescript
// lib/secure-storage.ts
class SecureStorage {
  private static readonly ACCESS_TOKEN_KEY = 'app_access_token';
  private static readonly USER_DATA_KEY = 'app_user_data';

  // Use memory storage for access token (more secure)
  private static accessToken: string | null = null;

  static setAccessToken(token: string) {
    this.accessToken = token;
  }

  static getAccessToken(): string | null {
    return this.accessToken;
  }

  static clearAccessToken() {
    this.accessToken = null;
  }

  // Use localStorage for user data (non-sensitive)
  static setUserData(userData: any) {
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  static getUserData(): any {
    const data = localStorage.getItem(this.USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  static clearUserData() {
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  static clearAll() {
    this.clearAccessToken();
    this.clearUserData();
  }
}
```

## 🧪 Step-by-Step Testing Guide

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:3000`
3. Environment variable: `NEXT_PUBLIC_API_URL=http://localhost:8000`

### Testing Steps

#### 1. Test User Registration
```bash
# Open browser to http://localhost:3000/register
# Fill form with:
# - Name: "Test User"
# - Email: "test@example.com"
# - Password: "TestPassword123!"
# - Confirm Password: "TestPassword123!"

# Expected: Redirect to dashboard with logged-in state
```

#### 2. Test Login Flow
```bash
# Navigate to http://localhost:3000/login
# Use credentials:
# - Email: "test@example.com"
# - Password: "TestPassword123!"

# Expected: Successful login, redirect to dashboard
```

#### 3. Test Admin Login
```bash
# Navigate to http://localhost:3000/login
# Use admin credentials:
# - Email: "admin@cryptohaven.com"
# - Password: "SecureAdminPassword123!"

# Expected: Redirect to admin dashboard
```

#### 4. Test Deposit Flow
```bash
# 1. Go to deposits page
# 2. Check deposit addresses are displayed
# 3. Submit deposit with:
#    - Coin: USDT
#    - Network: ERC20
#    - Amount: 100
#    - TX ID: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
#    - Note: "Test deposit"

# Expected: Success message, deposit appears in history
```

#### 5. Test Admin Approval
```bash
# 1. Login as admin
# 2. Go to admin dashboard
# 3. See pending deposit
# 4. Click "Review"
# 5. Add admin notes: "Verified and approved"
# 6. Click "Approve"

# Expected: Deposit status changes to APPROVED
```

#### 6. Test Withdrawal Eligibility
```bash
# 1. Login as regular user
# 2. Go to withdrawals page
# 3. Check eligibility status
# 4. Try to submit withdrawal

# Expected: Shows referral requirement not met
```

#### 7. Test API Error Handling
```bash
# 1. Try invalid login credentials
# 2. Try duplicate registration
# 3. Try accessing admin routes as regular user

# Expected: Proper error messages displayed
```

### Debug Commands

```bash
# Check network requests in browser dev tools
# Monitor API calls: F12 > Network tab

# Check localStorage
console.log(localStorage.getItem('access_token'));
console.log(localStorage.getItem('user'));

# Test API directly
curl -X GET "http://localhost:8000/api/health"

# Test authenticated endpoint
curl -X GET "http://localhost:8000/api/investments/plans" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Common Issues & Solutions

1. **CORS Errors**: Check backend CORS configuration
2. **401 Unauthorized**: Verify JWT token is being sent
3. **Network Errors**: Confirm API_URL environment variable
4. **Token Expiry**: Implement token refresh logic
5. **Form Validation**: Check Zod schema validation

This comprehensive integration guide provides production-ready code examples and testing procedures. Test each component systematically and let me know about any issues you encounter!

## 🚀 Phase 3 Preview

Once frontend integration is confirmed working:

**Phase 3: Background Jobs & Automation**
- Daily profit calculation system
- Investment completion handling  
- Email notification queues
- Automated status updates
- Performance monitoring

Ready to proceed when you confirm the frontend integration is working correctly!
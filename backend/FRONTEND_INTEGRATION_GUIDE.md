# CryptoHaven Frontend Integration Guide

Complete guide for integrating Next.js frontend with the CryptoHaven backend APIs.

## 🚀 Quick Setup Overview

### Backend Configuration
- **Base URL**: `http://localhost:8000` (development)
- **API Prefix**: All endpoints start with `/api`
- **Authentication**: JWT Bearer tokens
- **Content-Type**: `application/json`

### Frontend Requirements
- Next.js 13+ with App Router
- Tailwind CSS for styling
- JWT token management
- API service layer

## 📁 Recommended Frontend Structure

```
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── deposits/page.tsx
│   │   ├── withdrawals/page.tsx
│   │   ├── investments/page.tsx
│   │   └── referrals/page.tsx
│   └── admin/
│       ├── page.tsx
│       ├── deposits/page.tsx
│       └── withdrawals/page.tsx
├── components/
│   ├── ui/              # Existing UI components
│   ├── auth/
│   └── admin/
├── lib/
│   ├── api.ts           # API service layer
│   ├── auth.ts          # Authentication utilities
│   └── types.ts         # TypeScript types
└── hooks/
    ├── useAuth.ts       # Authentication hook
    └── useApi.ts        # API request hook
```

## 🔐 Step 1: Authentication System

### A. Create API Service Layer (`lib/api.ts`)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  messageKey: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && data.messageKey === 'auth.token_expired') {
        await this.refreshToken();
        // Retry original request
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
      } else {
        this.logout();
      }
    } catch (error) {
      this.logout();
    }
  }

  private logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Authentication APIs
  async register(data: {
    name: string;
    email: string;
    password: string;
    referralCode?: string;
  }): Promise<ApiResponse<{ user: any; accessToken: string; refreshToken: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: any; accessToken: string; refreshToken: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse(response);
  }

  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getProfile(): Promise<ApiResponse<{ user: any }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Deposit APIs
  async getDepositAddresses(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/deposits/addresses`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createDeposit(data: {
    txid: string;
    chain: 'ERC20' | 'TRC20' | 'BTC' | 'ETH';
    amount_usd: number;
    coin: 'USDT' | 'BTC' | 'ETH';
    note?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getUserDeposits(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ deposits: any[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);

    const response = await fetch(
      `${API_BASE_URL}/api/deposits?${searchParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    return this.handleResponse(response);
  }

  // Withdrawal APIs
  async checkWithdrawalEligibility(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/withdrawals/eligibility`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createWithdrawal(data: {
    amount_usd: number;
    destination_wallet: string;
    coin: 'USDT' | 'BTC' | 'ETH';
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/withdrawals`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getUserWithdrawals(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ withdrawals: any[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);

    const response = await fetch(
      `${API_BASE_URL}/api/withdrawals?${searchParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    return this.handleResponse(response);
  }

  // Investment APIs
  async getInvestmentPlans(): Promise<ApiResponse<{ plans: any[] }>> {
    const response = await fetch(`${API_BASE_URL}/api/investments/plans`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createInvestment(data: {
    plan_id: string;
    amount_usd: number;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/investments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getUserInvestments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ investments: any[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);

    const response = await fetch(
      `${API_BASE_URL}/api/investments?${searchParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    return this.handleResponse(response);
  }

  // Referral APIs
  async getReferralStats(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/referrals/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async generateReferralLink(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/referrals/link`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Admin APIs
  async getAdminDashboard(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAdminDeposits(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ deposits: any[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/deposits?${searchParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    return this.handleResponse(response);
  }

  async approveDeposit(
    id: string,
    data: { admin_notes?: string; approved_amount?: number }
  ): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/admin/deposits/${id}/approve`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async rejectDeposit(
    id: string,
    data: { admin_notes: string }
  ): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/api/admin/deposits/${id}/reject`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Fake Transactions (for activity feed)
  async getFakeTransactions(count = 20): Promise<ApiResponse<{ transactions: any[] }>> {
    const response = await fetch(`${API_BASE_URL}/api/fake-transactions?count=${count}`);
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
```

### B. Create Authentication Hook (`hooks/useAuth.ts`)

```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  balance_usd: string;
  referral_code: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Verify token is still valid
        await apiService.getProfile();
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data;
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiService.register(data);
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data;
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 📝 Step 2: Page Integration Examples

### A. Registration Page (`app/(auth)/register/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        referralCode: referralCode || undefined,
      });

      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {referralCode && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                You're joining with referral code: <strong>{referralCode}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### B. Login Page (`app/(auth)/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### C. Deposit Page (`app/dashboard/deposits/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [addresses, setAddresses] = useState<any>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
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

  const loadDeposits = async () => {
    try {
      const response = await apiService.getUserDeposits();
      if (response.success) {
        setDeposits(response.data?.deposits || []);
      }
    } catch (error) {
      console.error('Failed to load deposits:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await apiService.getDepositAddresses();
      if (response.success) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiService.createDeposit({
        txid: depositForm.txid,
        chain: depositForm.chain as any,
        amount_usd: parseFloat(depositForm.amount_usd),
        coin: depositForm.coin as any,
        note: depositForm.note || undefined,
      });

      if (response.success) {
        setSuccess('Deposit request submitted successfully! It will be reviewed by our team.');
        setDepositForm({
          txid: '',
          chain: 'ERC20',
          amount_usd: '',
          coin: 'USDT',
          note: '',
        });
        setShowDepositForm(false);
        loadDeposits();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to submit deposit');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Deposits</h1>
        
        {!showDepositForm && (
          <Button onClick={() => setShowDepositForm(true)}>
            New Deposit
          </Button>
        )}
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {showDepositForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit New Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            {addresses && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Deposit Addresses:</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>USDT (ERC20):</strong> {addresses.addresses?.USDT?.ERC20?.address}
                  </div>
                  <div>
                    <strong>USDT (TRC20):</strong> {addresses.addresses?.USDT?.TRC20?.address}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coin">Coin</Label>
                  <select
                    id="coin"
                    value={depositForm.coin}
                    onChange={(e) => setDepositForm({ ...depositForm, coin: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chain">Network</Label>
                  <select
                    id="chain"
                    value={depositForm.chain}
                    onChange={(e) => setDepositForm({ ...depositForm, chain: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="ERC20">ERC20</option>
                    <option value="TRC20">TRC20</option>
                    <option value="BTC">Bitcoin</option>
                    <option value="ETH">Ethereum</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="10"
                  value={depositForm.amount_usd}
                  onChange={(e) => setDepositForm({ ...depositForm, amount_usd: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txid">Transaction ID</Label>
                <Input
                  id="txid"
                  type="text"
                  value={depositForm.txid}
                  onChange={(e) => setDepositForm({ ...depositForm, txid: e.target.value })}
                  placeholder="Enter transaction hash"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  type="text"
                  value={depositForm.note}
                  onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                  placeholder="Additional information"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Deposit'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDepositForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Deposits List */}
      <div className="space-y-4">
        {deposits.map((deposit: any) => (
          <Card key={deposit.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">
                    {deposit.coin} {deposit.chain}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Transaction: {deposit.txid.substring(0, 20)}...
                  </p>
                </div>
                <Badge className={getStatusColor(deposit.status)}>
                  {deposit.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <p className="font-semibold">${deposit.amount_usd}</p>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <p className="font-semibold">
                    {new Date(deposit.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Network:</span>
                  <p className="font-semibold">{deposit.chain}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-semibold">{deposit.status}</p>
                </div>
              </div>

              {deposit.admin_notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    <strong>Admin Notes:</strong> {deposit.admin_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {deposits.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No deposits found</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🔧 Step 3: Admin Panel Integration

### Admin Dashboard (`app/admin/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardStats();
    }
  }, [isAdmin]);

  const loadDashboardStats = async () => {
    try {
      const response = await apiService.getAdminDashboard();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
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

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_activities.deposits.map((deposit: any) => (
                <div key={deposit.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{deposit.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {deposit.coin} - ${deposit.amount}
                    </p>
                  </div>
                  <Badge className={
                    deposit.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    deposit.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {deposit.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_activities.withdrawals.map((withdrawal: any) => (
                <div key={withdrawal.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{withdrawal.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.coin} - ${withdrawal.amount}
                    </p>
                  </div>
                  <Badge className={
                    withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    withdrawal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {withdrawal.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## 🔄 Step 4: App Layout Updates

### Root Layout (`app/layout.tsx`)

```typescript
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚨 Step 5: Error Handling & Loading States

### Create Error Boundary (`components/ErrorBoundary.tsx`)

```typescript
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 📱 Step 6: Responsive Design Tips

### Mobile-First API Calls

```typescript
// Use SWR or React Query for better data fetching
import useSWR from 'swr';

function useDeposits() {
  const { data, error, mutate } = useSWR('/deposits', () => 
    apiService.getUserDeposits()
  );

  return {
    deposits: data?.data?.deposits || [],
    loading: !error && !data,
    error,
    refresh: mutate,
  };
}
```

## 🔮 Phase 3: Daily Profit Background Jobs - Next Steps

### Overview
Phase 3 will implement automated daily profit calculations for active investments.

### Key Components:
1. **Cron Job System** - Daily profit calculation scheduler
2. **Investment Processing** - Calculate and credit daily profits
3. **Investment Completion** - Handle investment maturity
4. **Email Notifications** - Profit credited notifications
5. **Background Queue** - Process large volumes efficiently

### Implementation Plan:
1. **Profit Calculation Job** (`/src/jobs/dailyProfitJob.js`)
2. **Cron Scheduler** using node-cron or external cron
3. **Investment Status Updates** when investments complete
4. **Email Queue System** for notifications
5. **Logging & Monitoring** for job execution

### Backend Endpoints Ready:
- Investment creation with profit tracking
- User balance updates
- Transaction logging system
- Email service integration

### Next Phase Timeline:
- Background job infrastructure: 2-3 hours
- Profit calculation logic: 1-2 hours  
- Testing & validation: 1 hour
- Documentation: 30 minutes

Ready to proceed with Phase 3 when you confirm the frontend integration is working correctly!

---

This integration guide provides everything you need to connect your Next.js frontend with the CryptoHaven backend. Start with the authentication system and then progressively add each feature section.
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, DollarSign, PiggyBank, Users, ArrowUpRight, Copy, LogOut, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  email: string
  name: string
  balance: number
  totalInvested: number
  totalEarnings: number
  referralCode: string
  joinedDate: string
}

interface Investment {
  id: string
  plan: string
  amount: number
  dailyReturn: number
  startDate: string
  endDate: string
  status: "active" | "completed"
  totalEarned: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Load user data
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Mock investments data
      const mockInvestments: Investment[] = [
        {
          id: "1",
          plan: "Professional",
          amount: 2500,
          dailyReturn: 8,
          startDate: "2024-01-15",
          endDate: "2024-03-01",
          status: "active",
          totalEarned: 560,
        },
        {
          id: "2",
          plan: "Starter",
          amount: 500,
          dailyReturn: 5,
          startDate: "2024-01-01",
          endDate: "2024-01-31",
          status: "completed",
          totalEarned: 775,
        },
      ]
      setInvestments(mockInvestments)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isAuthenticated")
    router.push("/")
  }

  const handleDeposit = () => {
    if (!user || !depositAmount) return

    const amount = Number.parseFloat(depositAmount)
    if (amount > 0) {
      const updatedUser = { ...user, balance: user.balance + amount }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setMessage(`Successfully deposited $${amount}`)
      setDepositAmount("")
      setShowDeposit(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleWithdraw = () => {
    if (!user || !withdrawAmount) return

    const amount = Number.parseFloat(withdrawAmount)
    if (amount > 0 && amount <= user.balance) {
      const updatedUser = { ...user, balance: user.balance - amount }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setMessage(`Successfully withdrew $${amount}`)
      setWithdrawAmount("")
      setShowWithdraw(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const copyReferralCode = () => {
    if (user) {
      navigator.clipboard.writeText(user.referralCode)
      setMessage("Referral code copied to clipboard!")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TradePro</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-600">Welcome, {user.name}</span>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Account Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${user.balance.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Available for investment</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Invested</CardTitle>
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${user.totalInvested.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Across all plans</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${user.totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+12.5% this month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Referral Code</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{user.referralCode}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralCode}
                className="text-xs text-blue-600 p-0 h-auto mt-1"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Code
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => setShowDeposit(!showDeposit)} className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit Funds
                </Button>

                {showDeposit && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <Label htmlFor="deposit">Deposit Amount</Label>
                    <Input
                      id="deposit"
                      type="number"
                      placeholder="Enter amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <Button onClick={handleDeposit} className="w-full">
                      Confirm Deposit
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => setShowWithdraw(!showWithdraw)}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Withdraw Funds
                </Button>

                {showWithdraw && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <Label htmlFor="withdraw">Withdraw Amount</Label>
                    <Input
                      id="withdraw"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={user.balance}
                    />
                    <Button onClick={handleWithdraw} className="w-full">
                      Confirm Withdrawal
                    </Button>
                  </div>
                )}

                <Link href="/#plans">
                  <Button variant="outline" className="w-full bg-transparent">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    New Investment
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Referral Stats */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Earn up to 20% commission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Referrals</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Commission Earned</span>
                    <span className="font-semibold text-green-600">$125</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Your Referral Code</p>
                    <div className="flex items-center justify-between mt-1">
                      <code className="text-lg font-bold text-blue-900">{user.referralCode}</code>
                      <Button variant="ghost" size="sm" onClick={copyReferralCode}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Investments */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Your Investments</CardTitle>
                <CardDescription>Track your active and completed investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investments.map((investment) => (
                    <div
                      key={investment.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-slate-900">{investment.plan} Plan</h3>
                          <Badge variant={investment.status === "active" ? "default" : "secondary"}>
                            {investment.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600">Daily Return</p>
                          <p className="font-semibold text-green-600">{investment.dailyReturn}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Invested</p>
                          <p className="font-semibold">${investment.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Earned</p>
                          <p className="font-semibold text-green-600">${investment.totalEarned.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Start Date</p>
                          <p className="font-semibold">{new Date(investment.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">End Date</p>
                          <p className="font-semibold">{new Date(investment.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {investment.status === "active" && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Progress</span>
                            <span className="text-sm font-medium">
                              {Math.floor(
                                ((new Date().getTime() - new Date(investment.startDate).getTime()) /
                                  (new Date(investment.endDate).getTime() - new Date(investment.startDate).getTime())) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.floor(
                                  ((new Date().getTime() - new Date(investment.startDate).getTime()) /
                                    (new Date(investment.endDate).getTime() -
                                      new Date(investment.startDate).getTime())) *
                                    100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {investments.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-500 mb-4">No investments yet</p>
                      <Link href="/#plans">
                        <Button className="bg-blue-600 hover:bg-blue-700">Start Your First Investment</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

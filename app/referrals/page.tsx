"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Copy, Share2, DollarSign, Gift, ArrowRight, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

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

interface Referral {
  id: string
  name: string
  email: string
  joinedDate: string
  totalInvested: number
  commissionEarned: number
  status: "active" | "inactive"
}

export default function ReferralsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [message, setMessage] = useState("")
  const [referralLink, setReferralLink] = useState("")
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
      setReferralLink(`${window.location.origin}/register?ref=${parsedUser.referralCode}`)

      // Mock referrals data
      const mockReferrals: Referral[] = [
        {
          id: "1",
          name: "Alice Johnson",
          email: "alice@example.com",
          joinedDate: "2024-01-20",
          totalInvested: 1500,
          commissionEarned: 225,
          status: "active",
        },
        {
          id: "2",
          name: "Bob Smith",
          email: "bob@example.com",
          joinedDate: "2024-01-25",
          totalInvested: 800,
          commissionEarned: 80,
          status: "active",
        },
        {
          id: "3",
          name: "Carol Davis",
          email: "carol@example.com",
          joinedDate: "2024-02-01",
          totalInvested: 0,
          commissionEarned: 0,
          status: "inactive",
        },
      ]
      setReferrals(mockReferrals)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isAuthenticated")
    router.push("/")
  }

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    setMessage("Referral link copied to clipboard!")
    setTimeout(() => setMessage(""), 3000)
  }

  const copyReferralCode = () => {
    if (user) {
      navigator.clipboard.writeText(user.referralCode)
      setMessage("Referral code copied to clipboard!")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join CryptoHaven - Smart Trading Platform",
        text: "Start your trading journey with CryptoHaven and earn great returns!",
        url: referralLink,
      })
    } else {
      copyReferralLink()
    }
  }

  const totalCommissionEarned = referrals.reduce((sum, referral) => sum + referral.commissionEarned, 0)
  const activeReferrals = referrals.filter((ref) => ref.status === "active").length

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading referrals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image src="/cryptohaven-logo.jpg" alt="CryptoHaven Logo" width={32} height={32} className="rounded-lg" />
              <span className="text-xl font-bold text-slate-900">CryptoHaven</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/referrals" className="text-blue-600 font-medium">
              Referrals
            </Link>
          </nav>
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

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Referral Program</h1>
          <p className="text-slate-600">Earn up to 20% commission on every referral's investment</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{referrals.length}</div>
              <p className="text-xs text-slate-500 mt-1">{activeReferrals} active</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Commission Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${totalCommissionEarned.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+15% this month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Referral Code</CardTitle>
              <Gift className="h-4 w-4 text-purple-600" />
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

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Commission Rate</CardTitle>
              <ArrowRight className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">15%</div>
              <p className="text-xs text-slate-500 mt-1">Current tier rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Tools */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle>Share Your Link</CardTitle>
                <CardDescription>Invite friends and earn commissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Your Referral Link</label>
                  <div className="flex space-x-2">
                    <Input value={referralLink} readOnly className="text-sm" />
                    <Button variant="outline" size="sm" onClick={copyReferralLink}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Your Referral Code</label>
                  <div className="flex space-x-2">
                    <Input value={user.referralCode} readOnly className="text-sm font-mono" />
                    <Button variant="outline" size="sm" onClick={copyReferralCode}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button onClick={shareReferralLink} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </CardContent>
            </Card>

            {/* Commission Tiers */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Commission Tiers</CardTitle>
                <CardDescription>Earn more as you refer more</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Starter Plan</p>
                      <p className="text-sm text-slate-600">10% commission</p>
                    </div>
                    <Badge variant="secondary">10%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div>
                      <p className="font-medium text-blue-900">Professional Plan</p>
                      <p className="text-sm text-blue-700">15% commission</p>
                    </div>
                    <Badge className="bg-blue-600">15%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Premium Plan</p>
                      <p className="text-sm text-slate-600">20% commission</p>
                    </div>
                    <Badge variant="secondary">20%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referrals List */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Your Referrals</CardTitle>
                <CardDescription>Track your referred users and earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {referral.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{referral.name}</h3>
                            <p className="text-sm text-slate-600">{referral.email}</p>
                          </div>
                        </div>
                        <Badge variant={referral.status === "active" ? "default" : "secondary"}>
                          {referral.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Joined</p>
                          <p className="font-semibold">{new Date(referral.joinedDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Total Invested</p>
                          <p className="font-semibold">${referral.totalInvested.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Your Commission</p>
                          <p className="font-semibold text-green-600">${referral.commissionEarned.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {referrals.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 mb-4">No referrals yet</p>
                      <p className="text-sm text-slate-400 mb-4">
                        Share your referral link to start earning commissions
                      </p>
                      <Button onClick={shareReferralLink} className="bg-blue-600 hover:bg-blue-700">
                        Share Your Link
                      </Button>
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

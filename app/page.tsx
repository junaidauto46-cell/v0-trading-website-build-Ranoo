import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Shield, TrendingUp, Users, Star, CheckCircle } from "lucide-react"
import Link from "next/link"
import { ActivityFeed } from "@/components/activity-feed"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">TradePro</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#plans" className="text-slate-600 hover:text-blue-600 transition-colors">
              Investment Plans
            </Link>
            <Link href="#about" className="text-slate-600 hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-slate-600 hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100">
            🚀 Trusted by 50,000+ investors worldwide
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 text-balance">
            Smart Trading,
            <span className="text-blue-600"> Smarter Returns</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto text-pretty">
            Join the future of intelligent trading with our AI-powered platform. Start with as little as $100 and watch
            your investments grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Start Trading Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent">
              Watch Demo
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="text-slate-600">Bank-level Security</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span className="text-slate-600">AI-Powered Analytics</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-slate-600">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans Section */}
      <section id="plans" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Investment Plan</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Flexible plans designed to match your investment goals and risk tolerance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="relative border-2 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-slate-900">Starter</CardTitle>
                <CardDescription className="text-slate-600">Perfect for beginners</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900">5%</span>
                  <span className="text-slate-600 ml-2">daily return</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Minimum: $100</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Maximum: $999</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Duration: 30 days</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Referral bonus: 10%</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Choose Plan</Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 hover:shadow-xl">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-slate-900">Professional</CardTitle>
                <CardDescription className="text-slate-600">For serious investors</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">8%</span>
                  <span className="text-slate-600 ml-2">daily return</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Minimum: $1,000</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Maximum: $4,999</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Duration: 45 days</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Referral bonus: 15%</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Choose Plan</Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-slate-900">Premium</CardTitle>
                <CardDescription className="text-slate-600">Maximum returns</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-purple-600">12%</span>
                  <span className="text-slate-600 ml-2">daily return</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Minimum: $5,000</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Maximum: $50,000</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Duration: 60 days</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-600">Referral bonus: 20%</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">Choose Plan</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Live Trading Activity</h2>
            <p className="text-xl text-slate-600">See what our community is achieving in real-time</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <ActivityFeed />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">TradePro</span>
              </div>
              <p className="text-slate-400 mb-4">
                The most trusted platform for intelligent trading and investment growth.
              </p>
              <div className="flex space-x-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-slate-400 ml-2">4.9/5 (2,847 reviews)</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Investment Plans
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Trading Tools
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Mobile App
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Live Chat
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Risk Disclosure
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>
              &copy; 2024 TradePro. All rights reserved. Trading involves risk and may not be suitable for all
              investors.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

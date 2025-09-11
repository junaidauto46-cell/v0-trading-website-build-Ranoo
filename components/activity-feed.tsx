"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Users, Gift } from "lucide-react"

interface Activity {
  id: string
  type: "investment" | "withdrawal" | "referral" | "commission"
  user: string
  amount: number
  plan?: string
  timestamp: string
  location?: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  // Generate random activities
  const generateRandomActivity = (): Activity => {
    const types: Activity["type"][] = ["investment", "withdrawal", "referral", "commission"]
    const users = [
      "John D.",
      "Sarah M.",
      "Mike R.",
      "Lisa K.",
      "David L.",
      "Emma W.",
      "James B.",
      "Anna C.",
      "Tom H.",
      "Maria G.",
      "Alex P.",
      "Sophie T.",
      "Ryan F.",
      "Kate N.",
      "Ben S.",
    ]
    const plans = ["Starter", "Professional", "Premium"]
    const locations = ["New York", "London", "Tokyo", "Sydney", "Berlin", "Toronto", "Dubai", "Singapore"]

    const type = types[Math.floor(Math.random() * types.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const plan = plans[Math.floor(Math.random() * plans.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]

    let amount: number
    switch (type) {
      case "investment":
        amount = Math.floor(Math.random() * 10000) + 100
        break
      case "withdrawal":
        amount = Math.floor(Math.random() * 5000) + 50
        break
      case "referral":
        amount = Math.floor(Math.random() * 2000) + 100
        break
      case "commission":
        amount = Math.floor(Math.random() * 500) + 10
        break
      default:
        amount = 100
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      user,
      amount,
      plan: type === "investment" ? plan : undefined,
      timestamp: new Date().toISOString(),
      location,
    }
  }

  useEffect(() => {
    // Initialize with some activities
    const initialActivities = Array.from({ length: 8 }, generateRandomActivity)
    setActivities(initialActivities)

    // Add new activity every 3-8 seconds
    const interval = setInterval(
      () => {
        const newActivity = generateRandomActivity()
        setActivities((prev) => [newActivity, ...prev.slice(0, 19)]) // Keep only last 20 activities
      },
      Math.random() * 5000 + 3000,
    ) // Random interval between 3-8 seconds

    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "investment":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case "withdrawal":
        return <ArrowDownLeft className="w-4 h-4 text-blue-600" />
      case "referral":
        return <Users className="w-4 h-4 text-purple-600" />
      case "commission":
        return <Gift className="w-4 h-4 text-orange-600" />
      default:
        return <TrendingUp className="w-4 h-4 text-slate-600" />
    }
  }

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case "investment":
        return `invested $${activity.amount.toLocaleString()} in ${activity.plan} plan`
      case "withdrawal":
        return `withdrew $${activity.amount.toLocaleString()}`
      case "referral":
        return `joined through referral and invested $${activity.amount.toLocaleString()}`
      case "commission":
        return `earned $${activity.amount.toLocaleString()} referral commission`
      default:
        return `completed a transaction of $${activity.amount.toLocaleString()}`
    }
  }

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "investment":
        return "bg-green-50 border-green-200"
      case "withdrawal":
        return "bg-blue-50 border-blue-200"
      case "referral":
        return "bg-purple-50 border-purple-200"
      case "commission":
        return "bg-orange-50 border-orange-200"
      default:
        return "bg-slate-50 border-slate-200"
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-900">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Trading Activity</span>
          <Badge variant="secondary" className="ml-auto">
            {activities.length} recent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${getActivityColor(
                activity.type,
              )} ${index === 0 ? "animate-fade-in" : ""}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    <span className="font-semibold text-slate-900">{activity.user}</span>{" "}
                    <span className="text-slate-700">{getActivityText(activity)}</span>
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                    <span>{getTimeAgo(activity.timestamp)}</span>
                    {activity.location && (
                      <>
                        <span>•</span>
                        <span>{activity.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">${activity.amount.toLocaleString()}</p>
                {activity.plan && <p className="text-xs text-slate-600">{activity.plan}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

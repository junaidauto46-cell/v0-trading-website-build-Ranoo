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

    const usersWithLocations = [
      // International users
      { name: "John D.", location: "New York" },
      { name: "Sarah M.", location: "London" },
      { name: "Mike R.", location: "Sydney" },
      { name: "Lisa K.", location: "Berlin" },
      { name: "David L.", location: "Toronto" },
      { name: "Emma W.", location: "London" },
      { name: "James B.", location: "New York" },
      { name: "Anna C.", location: "Berlin" },
      { name: "Tom H.", location: "Sydney" },
      { name: "Maria G.", location: "Toronto" },
      { name: "Alex P.", location: "Dubai" },
      { name: "Sophie T.", location: "Singapore" },
      { name: "Ryan F.", location: "Tokyo" },
      { name: "Kate N.", location: "London" },
      { name: "Ben S.", location: "New York" },

      // Pakistani users
      { name: "Ali R.", location: "Karachi" },
      { name: "Hamza S.", location: "Lahore" },
      { name: "Fatima A.", location: "Islamabad" },
      { name: "Zain M.", location: "Karachi" },
      { name: "Ahmed H.", location: "Lahore" },
      { name: "Ayesha K.", location: "Islamabad" },

      // Indian users
      { name: "Aarav P.", location: "Mumbai" },
      { name: "Rohit K.", location: "Delhi" },
      { name: "Priya S.", location: "Bangalore" },
      { name: "Arjun V.", location: "Mumbai" },
    ]

    const plans = ["Starter", "Professional", "Premium"]

    const type = types[Math.floor(Math.random() * types.length)]
    const userWithLocation = usersWithLocations[Math.floor(Math.random() * usersWithLocations.length)]
    const plan = plans[Math.floor(Math.random() * plans.length)]

    let amount: number
    switch (type) {
      case "investment":
        if (plan === "Starter") {
          amount = Math.floor(Math.random() * 91) + 10 // $10-$100
        } else if (plan === "Professional") {
          amount = Math.floor(Math.random() * 401) + 100 // $100-$500
        } else {
          // Premium
          amount = Math.floor(Math.random() * 501) + 500 // $500-$1000
        }
        break
      case "withdrawal":
        // Starter plan earnings: $10-100 * 1.5% = $0.15-1.5 daily, so monthly could be $4.5-45
        // Professional plan: $100-500 * 2% = $2-10 daily, so monthly could be $60-300
        // Premium plan: $500-1000 * 2.5% = $12.5-25 daily, so monthly could be $375-750
        const withdrawalRanges = [
          Math.floor(Math.random() * 41) + 5, // $5-$45 (Starter earnings)
          Math.floor(Math.random() * 241) + 60, // $60-$300 (Professional earnings)
          Math.floor(Math.random() * 376) + 375, // $375-$750 (Premium earnings)
        ]
        amount = withdrawalRanges[Math.floor(Math.random() * withdrawalRanges.length)]
        break
      case "referral":
        amount = Math.floor(Math.random() * 101) + 50 // $50-$150
        break
      case "commission":
        amount = Math.floor(Math.random() * 51) + 10 // $10-$60
        break
      default:
        amount = 100
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      user: userWithLocation.name, // Use name from the mapped object
      amount,
      plan: type === "investment" ? plan : undefined,
      timestamp: new Date().toISOString(),
      location: userWithLocation.location, // Use location from the mapped object
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

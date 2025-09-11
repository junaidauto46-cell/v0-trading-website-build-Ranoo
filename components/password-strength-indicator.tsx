"use client"

import {
  validatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
} from "@/utils/password-validation"

interface PasswordStrengthIndicatorProps {
  password: string
  showFeedback?: boolean
}

export function PasswordStrengthIndicator({ password, showFeedback = true }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const strength = validatePasswordStrength(password)
  const strengthColor = getPasswordStrengthColor(strength.score)
  const strengthText = getPasswordStrengthText(strength.score)

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              strength.score <= 1
                ? "bg-red-500"
                : strength.score <= 2
                  ? "bg-orange-500"
                  : strength.score <= 3
                    ? "bg-yellow-500"
                    : strength.score <= 4
                      ? "bg-blue-500"
                      : "bg-green-500"
            }`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${strengthColor}`}>{strengthText}</span>
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <ul className="text-sm text-red-600 space-y-1">
          {strength.feedback.map((feedback, index) => (
            <li key={index} className="flex items-center space-x-1">
              <span className="w-1 h-1 bg-red-500 rounded-full" />
              <span>{feedback}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

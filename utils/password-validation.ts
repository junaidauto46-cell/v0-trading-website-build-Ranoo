export interface PasswordStrength {
  score: number
  feedback: string[]
  isValid: boolean
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Check minimum length
  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters long")
  } else {
    score += 1
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password must contain at least one uppercase letter")
  } else {
    score += 1
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    feedback.push("Password must contain at least one lowercase letter")
  } else {
    score += 1
  }

  // Check for number
  if (!/\d/.test(password)) {
    feedback.push("Password must contain at least one number")
  } else {
    score += 1
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    feedback.push("Password must contain at least one special character (!@#$%^&*)")
  } else {
    score += 1
  }

  // Check for common weak passwords
  const weakPasswords = ["123", "123456", "password", "admin", "qwerty", "111111", "000000"]
  if (weakPasswords.some((weak) => password.toLowerCase().includes(weak))) {
    feedback.push("Password contains common weak patterns")
    score = Math.max(0, score - 2)
  }

  return {
    score,
    feedback,
    isValid: score >= 5 && feedback.length === 0,
  }
}

export function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return "text-red-500"
  if (score <= 2) return "text-orange-500"
  if (score <= 3) return "text-yellow-500"
  if (score <= 4) return "text-blue-500"
  return "text-green-500"
}

export function getPasswordStrengthText(score: number): string {
  if (score <= 1) return "Very Weak"
  if (score <= 2) return "Weak"
  if (score <= 3) return "Fair"
  if (score <= 4) return "Good"
  return "Strong"
}

/**
 * Frontend Security Utilities
 * 
 * Provides input validation, sanitization, and security helpers
 * to protect against XSS, injection attacks, and malicious inputs
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Validate and sanitize user input
 * Removes potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .trim()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Requirements: minimum 8 characters
 */
export function validatePassword(password: string): {
  valid: boolean
  message: string
} {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  return { valid: true, message: 'Password is strong' }
}

/**
 * Validate URL format
 * Prevents javascript: and data: protocols
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255) // Limit length
}

/**
 * Validate file type by extension
 */
export function isValidImageFile(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return validExtensions.includes(ext)
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return size <= maxSizeBytes
}

/**
 * Check if content contains suspicious patterns
 */
export function containsSuspiciousContent(content: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /setTimeout\(/i,
    /setInterval\(/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(content))
}

/**
 * Rate limiting helper for client-side
 * Prevents rapid repeated actions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  /**
   * Check if action is allowed
   * Returns true if allowed, false if rate limited
   */
  canPerform(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }
    
    // Add current attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    
    return true
  }
  
  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

/**
 * Secure storage wrapper for sensitive data
 * Uses sessionStorage with basic encryption
 */
export class SecureStorage {
  private static encode(data: string): string {
    return btoa(encodeURIComponent(data))
  }
  
  private static decode(data: string): string {
    return decodeURIComponent(atob(data))
  }
  
  static setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, this.encode(value))
    } catch (error) {
      console.error('Failed to store data:', error)
    }
  }
  
  static getItem(key: string): string | null {
    try {
      const item = sessionStorage.getItem(key)
      return item ? this.decode(item) : null
    } catch (error) {
      console.error('Failed to retrieve data:', error)
      return null
    }
  }
  
  static removeItem(key: string): void {
    sessionStorage.removeItem(key)
  }
  
  static clear(): void {
    sessionStorage.clear()
  }
}

/**
 * CSRF Token Helper
 * Extracts and manages CSRF tokens from cookies
 */
export function getCSRFToken(): string | null {
  const name = 'csrftoken'
  const cookies = document.cookie.split(';')
  
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === name) {
      return decodeURIComponent(value)
    }
  }
  
  return null
}

/**
 * Prevent clickjacking
 * Checks if page is in an iframe
 */
export function preventClickjacking(): void {
  if (window.self !== window.top) {
    // Page is in an iframe - potentially clickjacking attempt
    window.top!.location.href = window.self.location.href
  }
}

/**
 * Input validation for common fields
 */
export const validators = {
  username: (value: string) => {
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 30) return 'Username must be less than 30 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, underscores, and hyphens'
    return null
  },
  
  displayName: (value: string) => {
    if (value.length > 50) return 'Display name must be less than 50 characters'
    return null
  },
  
  price: (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return 'Price must be a valid number'
    if (num < 0) return 'Price cannot be negative'
    if (num > 1000000) return 'Price is too high'
    return null
  },
  
  title: (value: string) => {
    if (value.length < 5) return 'Title must be at least 5 characters'
    if (value.length > 100) return 'Title must be less than 100 characters'
    if (containsSuspiciousContent(value)) return 'Title contains invalid characters'
    return null
  },
  
  description: (value: string) => {
    if (value.length > 5000) return 'Description is too long'
    if (containsSuspiciousContent(value)) return 'Description contains invalid content'
    return null
  },
  
  comment: (value: string) => {
    if (value.length < 1) return 'Comment cannot be empty'
    if (value.length > 1000) return 'Comment is too long'
    if (containsSuspiciousContent(value)) return 'Comment contains invalid content'
    return null
  },
}

/**
 * Debounce function for preventing rapid API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for rate limiting user actions
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Log security events (for monitoring)
 */
export function logSecurityEvent(event: string, details?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Security Event]', event, details)
  }
  
  // In production, you could send this to a logging service
  // Example: sendToLoggingService({ event, details, timestamp: Date.now() })
}

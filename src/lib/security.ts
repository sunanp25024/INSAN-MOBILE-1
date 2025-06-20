/**
 * Security utilities for safe operations
 * Prevents common security vulnerabilities
 */

import { logger } from './logger';
import bcryptjs from 'bcryptjs';

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    logger.warn('Non-string input provided to sanitizeInput', { input });
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Safe JSON parsing
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    logger.warn('Failed to parse JSON string', { error, jsonString: jsonString.substring(0, 100) });
    return fallback;
  }
}

// Safe localStorage operations
export const safeStorage = {
  getItem<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined') return fallback;
      
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      
      return safeJsonParse(item, fallback);
    } catch (error) {
      logger.warn('Failed to get item from localStorage', { key, error });
      return fallback;
    }
  },
  
  setItem(key: string, value: unknown): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn('Failed to set item in localStorage', { key, error });
      return false;
    }
  },
  
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.warn('Failed to remove item from localStorage', { key, error });
      return false;
    }
  }
};

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      logger.warn('Rate limit exceeded', { key, attempts: validAttempts.length, maxAttempts });
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// CSRF token generation (for forms)
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Safe URL validation
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Sanitize data for logging (remove sensitive information)
export function sanitizeForLogging(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'access_token', 'refresh_token', 'api_key', 'private_key'
  ];
  
  const sanitized = { ...data as Record<string, unknown> };
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Password hashing dengan bcryptjs
export async function hashPassword(password: string): Promise<string> {
  try {
    // Generate salt dengan cost factor 10 (bisa disesuaikan untuk keseimbangan keamanan dan performa)
    const salt = await bcryptjs.genSalt(10);
    // Hash password dengan salt
    const hashedPassword = await bcryptjs.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw new Error('Gagal mengamankan password');
  }
}

// Verifikasi password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Bandingkan password dengan hash yang tersimpan
    return await bcryptjs.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Error verifying password', { error });
    return false;
  }
}
/**
 * Environment configuration with validation
 * Prevents exposure of sensitive data and validates required environment variables
 */

// Define required environment variables
interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

// Validate and parse environment variables
function validateEnvironment(): EnvironmentConfig {
  const env = process.env;
  
  // Required variables
  const requiredVars = {
    NODE_ENV: env.NODE_ENV || 'development',
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // Check for missing required variables
  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(requiredVars.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${requiredVars.NODE_ENV}. Must be 'development', 'production', or 'test'.`
    );
  }

  // Validate Supabase URL format
  try {
    new URL(requiredVars.NEXT_PUBLIC_SUPABASE_URL!);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: ${requiredVars.NEXT_PUBLIC_SUPABASE_URL}. Must be a valid URL.`
    );
  }

  return {
    NODE_ENV: requiredVars.NODE_ENV as 'development' | 'production' | 'test',
    NEXT_PUBLIC_SUPABASE_URL: requiredVars.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

// Export validated environment configuration
export const env = validateEnvironment();

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Safe environment object for client-side (only public variables)
export const clientEnv = {
  NODE_ENV: env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
};

// Function to safely log environment status (without sensitive data)
export function logEnvironmentStatus(): void {
  if (isDevelopment) {
    console.log('Environment Status:', {
      NODE_ENV: env.NODE_ENV,
      SUPABASE_URL_SET: !!env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY_SET: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      VAPID_KEY_SET: !!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      SERVICE_ROLE_KEY_SET: !!env.SUPABASE_SERVICE_ROLE_KEY,
    });
  }
}
/**
 * Users Service Configuration
 *
 * Service-specific configuration values
 * Constants, URLs, limits, and other config specific to users service
 */

/**
 * User validation rules
 */
export const USER_CONFIG = {
  // Validation
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 8,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Rate limiting (requests per minute)
  RATE_LIMIT_PER_USER: 100,

  // Avatar/Profile
  MAX_AVATAR_SIZE_MB: 5,
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Session
  SESSION_TIMEOUT_MINUTES: 60,
} as const;

/**
 * User-related URLs and endpoints
 * (if this service needs to call external APIs)
 */
export const USER_URLS = {
  // AVATAR_CDN: Deno.env.get("AVATAR_CDN_URL") || "https://cdn.example.com",
  // EMAIL_SERVICE: Deno.env.get("EMAIL_SERVICE_URL") || "https://email.example.com",
} as const;

/**
 * User status enum
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

/**
 * User role enum
 */
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

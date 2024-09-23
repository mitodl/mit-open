/* eslint-disable no-var */

export type PostHogSettings = {
  api_key: string
  timeout?: int
  bootstrap_flags?: Record<string, string | boolean>
}

export declare global {
  declare const APP_SETTINGS: {
    MITOL_AXIOS_WITH_CREDENTIALS?: boolean
    MITOL_API_BASE_URL: string
    CSRF_COOKIE_NAME: string
    EMBEDLY_KEY: string
    CKEDITOR_UPLOAD_URL?: string
    SENTRY_DSN?: string
    SENTRY_ENV?: string
    SENTRY_PROFILES_SAMPLE_RATE: number
    SENTRY_TRACES_SAMPLE_RATE: number
    VERSION?: string
    POSTHOG?: PostHogSettings
    SITE_NAME: string
    MITOL_SUPPORT_EMAIL: string
    PUBLIC_URL: string
    DEFAULT_SEARCH_MODE: string
    DEFAULT_SEARCH_SLOP: number
    DEFAULT_SEARCH_STALENESS_PENALTY: number
    DEFAULT_SEARCH_MINIMUM_SCORE_CUTOFF: number
    DEFAULT_SEARCH_MAX_INCOMPLETENESS_PENALTY: number
  }
}

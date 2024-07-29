/* eslint-disable no-var */

export type PostHogSettings = {
  api_key: string
  timeout?: int
  bootstrap_flags?: Record<string, string | boolean>
}

export declare global {
  declare const APP_SETTINGS: {
    MITOPEN_AXIOS_WITH_CREDENTIALS?: boolean
    MITOPEN_API_BASE_URL: string
    EMBEDLY_KEY: string
    CKEDITOR_UPLOAD_URL?: string
    SENTRY_DSN?: string
    VERSION?: string
    ENVIRONMENT?: string
    POSTHOG?: PostHogSettings
    SITE_NAME: string
    MITOPEN_SUPPORT_EMAIL: string
    PUBLIC_URL: string
  }
}

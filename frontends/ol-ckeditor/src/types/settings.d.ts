/* eslint-disable no-var */

export type PostHogSettings = {
  api_key: string
  timeout?: int
  bootstrap_flags?: Record<string, string | boolean>
}

export declare global {
  const APP_SETTINGS: {
    EMBEDLY_KEY: string
    CKEDITOR_UPLOAD_URL?: string
    MITOL_AXIOS_WITH_CREDENTIALS: boolean
    MITOL_API_BASE_URL: string
    PUBLIC_URL: string
    SITE_NAME: string
    CSRF_COOKIE_NAME: string
    POSTHOG?: PostHogSettings
  }
}

/* eslint-disable no-var */

export type PostHogSettings = {
  api_key: string
  timeout?: int
  bootstrap_flags?: Record<string, string | boolean>
}

export declare global {
  declare const APP_SETTINGS: {
    axios_with_credentials?: string
    axios_base_path?: string
    embedlyKey: string
    ckeditor_upload_url?: string
    sentry_dsn?: string
    release_version?: string
    environment?: string
    posthog?: PostHogSettings
  }
}

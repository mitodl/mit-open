export type User = {
  id: number | null
  first_name: string | null
  last_name: string | null
  is_authenticated: boolean
  is_article_editor: boolean
  is_learning_path_editor: boolean
}

export type PostHogSettings = {
  api_key: string
  timeout?: int
  bootstrap_flags?: Record<string, string | boolean>
}

export declare global {
  const APP_SETTINGS: {
    SENTRY_DSN?: string
    VERSION?: string
    ENVIRONMENT?: string
    posthog?: PostHogSettings
  }
}

/* eslint-disable no-var */
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
  interface Window {
    SETTINGS: SETTINGS
  }

  /**
   * Settings injected by Django
   */
  interface SETTINGS {
    user: User
    posthog?: PostHogSettings
  }
  const APP_SETTINGS: {
    search_page_size: number
    sentry_dsn?: string
    release_version?: string
    environment?: string
    embedlyKey: string
  }
}

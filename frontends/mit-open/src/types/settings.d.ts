/* eslint-disable no-var */
export type User = {
  id: number | null
  first_name: string | null
  last_name: string | null
  is_authenticated: boolean
  is_article_editor: boolean
  is_learning_path_editor: boolean
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
  }
  const APP_SETTINGS: {
    search_page_size: number
    ocw_next_base_url: string
    sentry_dsn?: string
    release_version?: string
    environment?: string
    embedlyKey: string
  }
}

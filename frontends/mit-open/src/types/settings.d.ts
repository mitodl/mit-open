/* eslint-disable no-var */
export type User = {
  id: number | null
  is_authenticated: boolean
  is_public_list_editor: boolean
  is_staff_list_editor: boolean
}

export declare global {
  interface Window {
    SETTINGS: SETTINGS
  }

  /**
   * Settings injected by Django
   */
  interface SETTINGS {
    search_page_size: number
    embedlyKey: string
    ocw_next_base_url: string
    user: User
    sentry_dsn?: string
    release_version?: string
    environment?: string
  }
}

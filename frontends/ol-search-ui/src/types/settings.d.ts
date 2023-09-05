/* eslint-disable no-var */

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
  }
}

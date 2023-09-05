/* eslint-disable no-var */

export declare global {
  interface Window {
    SETTINGS: SETTINGS
  }

  /**
   * Settings injected by Django
   */
  interface SETTINGS {
    embedlyKey?: string
  }
}

export type PostHogSettings = {
  api_key: string
  timeout?: int
  bootstrap_flags?: Record<string, string | boolean>
}

import React from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router-dom"
import invariant from "tiny-invariant"
import * as Sentry from "@sentry/react"
import { createQueryClient } from "@/services/react-query/react-query"
import routes from "./routes"
import AppProviders from "./AppProviders"

Sentry.init({
  dsn: APP_SETTINGS.SENTRY_DSN,
  release: APP_SETTINGS.VERSION,
  environment: APP_SETTINGS.SENTRY_ENV,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  profilesSampleRate: APP_SETTINGS.SENTRY_PROFILES_SAMPLE_RATE,
  tracesSampleRate: APP_SETTINGS.SENTRY_TRACES_SAMPLE_RATE,
  tracePropagationTargets: [APP_SETTINGS.MITOL_API_BASE_URL],
})

const container = document.getElementById("app-container")
invariant(container, "Could not find container element")
const root = createRoot(container)

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

root.render(<AppProviders queryClient={queryClient} router={router} />)

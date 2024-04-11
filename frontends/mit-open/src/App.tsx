import React from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router-dom"
import invariant from "tiny-invariant"
import * as Sentry from "@sentry/react"
import { createQueryClient } from "@/services/react-query/react-query"
import routes from "./routes"
import AppProviders from "./AppProviders"

Sentry.init({
  dsn: APP_SETTINGS.sentry_dsn,
  release: APP_SETTINGS.release_version,
  environment: APP_SETTINGS.environment,
})

// This is needed for HMR to work, pending Webpack fix for https://github.com/webpack-contrib/webpack-hot-middleware/issues/390
if (["local", "docker"].includes(process.env.ENVIRONMENT!)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(module as any).hot?.accept()
}

const container = document.getElementById("app-container")
invariant(container, "Could not find container element")
const root = createRoot(container)

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

root.render(<AppProviders queryClient={queryClient} router={router} />)

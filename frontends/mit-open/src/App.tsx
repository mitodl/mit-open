import React from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router-dom"
import invariant from "tiny-invariant"
import * as Sentry from "@sentry/react"
import { createQueryClient } from "@/services/react-query/react-query"
import routes from "./routes"
import AppProviders from "./AppProviders"

console.log("wut!!!?")

Sentry.init({
  dsn: window.SETTINGS.sentry_dsn,
  release: window.SETTINGS.release_version,
  environment: window.SETTINGS.environment,
})

const container = document.getElementById("app-container")
invariant(container, "Could not find container element")
const root = createRoot(container)

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

root.render(<AppProviders queryClient={queryClient} router={router} />)

import React from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter } from "react-router-dom"
import invariant from "tiny-invariant"
import * as Sentry from "@sentry/react"
import { createQueryClient } from "@/services/react-query/react-query"
import routes from "./routes"
import AppProviders from "./AppProviders"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.VERSION,
  environment: process.env.SENTRY_ENV,
})

const container = document.getElementById("app-container")
invariant(container, "Could not find container element")
const root = createRoot(container)

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

root.render(<AppProviders queryClient={queryClient} router={router} />)

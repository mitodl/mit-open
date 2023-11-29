import React from "react"
import { createRoot } from "react-dom/client"
import { createQueryClient } from "../libs/react-query"
import { AppProviders } from "../AppProviders"
import invariant from "tiny-invariant"
import * as Sentry from "@sentry/react"
import { createBrowserRouter } from "react-router-dom"
import routes from "../routes"

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

import React from "react"
import { createRoot } from "react-dom/client"
import { createBrowserHistory } from "history"
import { createQueryClient } from "../libs/react-query"
import App from "../App"
import invariant from "tiny-invariant"
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: window.SETTINGS.sentry_dsn,
  release: window.SETTINGS.release_version,
  environment: window.SETTINGS.environment,
})

const container = document.getElementById("container")
invariant(container, "Could not find container element")
const root = createRoot(container)

const browserHistory = createBrowserHistory()
const queryClient = createQueryClient(browserHistory)

root.render(<App queryClient={queryClient} history={browserHistory} />)

import React, { StrictMode } from "react"
import { HelmetProvider } from "react-helmet-async"

import { Route, Router, Switch } from "react-router"
import { History } from "history"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"

import { muiTheme } from "./libs/mui"
import Header from "./components/Header"
import LearningResourceDrawer from "./components/LearningResourceDrawer"
import infiniteRoutes from "./infinite-pages/routes"
import NotFoundPage from "./pages/errors/NotFoundPage"
import ErrorPageRedirect from "./pages/errors/ErrorPageRedirect"
import routes from "./pages/routes"

interface AppProps {
  /**
   * App [history](https://v5.reactrouter.com/web/api/history) object.
   *  - Use BrowserHistory for the real app
   *  - Use MemoryHistory for tests.
   */
  history: History
  queryClient: QueryClient
}

/**
 * Renders child with Router, QueryClientProvider, and other such context provides.
 */
const AppProviders: React.FC<AppProps & { children: React.ReactNode }> = ({
  history,
  queryClient,
  children,
}) => {
  return (
    <StrictMode>
      <MuiThemeProvider theme={muiTheme}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <Router history={history}>
              <NiceModalProvider>{children}</NiceModalProvider>
            </Router>
          </HelmetProvider>
          <ReactQueryDevtools
            initialIsOpen={false}
            toggleButtonProps={{ style: { opacity: 0.5 } }}
          />
        </QueryClientProvider>
      </MuiThemeProvider>
    </StrictMode>
  )
}

const App: React.FC<AppProps> = ({ history, queryClient }) => {
  return (
    <div className="app-container">
      <AppProviders history={history} queryClient={queryClient}>
        <Header />
        <ErrorPageRedirect>
          <Switch>
            {routes.map((route) => (
              <Route key={JSON.stringify(route.path)} {...route} />
            ))}
            {infiniteRoutes.map((route) => (
              <Route key={JSON.stringify(route.path)} {...route} />
            ))}
            <Route component={NotFoundPage} />
          </Switch>
          <LearningResourceDrawer />
        </ErrorPageRedirect>
      </AppProviders>
    </div>
  )
}

export default App
export { AppProviders }

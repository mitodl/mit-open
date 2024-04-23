import React from "react"
import Header from "./Header"
import { Grid, ThemeProvider, styled, Typography } from "ol-components"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { RouteObject, Outlet } from "react-router"
import "./style.css"

const PUBLIC_URL = process.env.PUBLIC_URL || ""

const Page = styled.div`
  margin: auto;
  max-width: 1200px;
`

const Links = styled.div`
  margin-top: 4rem;
`

const LinkItem = styled.div`
  margin-bottom: 3rem;

  a {
    text-decoration: underline;
  }
`

const routes: RouteObject[] = [
  {
    element: (
      <>
        <Header />
        <Outlet />
      </>
    ),
    children: [
      {
        path: "/",
        element: (
          <Page>
            <Grid item xs={12} md={7}>
              <Typography variant="h1">Developer Materials</Typography>
              <h2>
                Libraries and tools for application development for use in your
                projects
              </h2>
              <Links>
                <LinkItem>
                  <h3>
                    <a href={`${PUBLIC_URL}/storybook`}>
                      React Component Library
                    </a>
                  </h3>
                  MIT Open Learning's React component library, presented with{" "}
                  <a href="https://storybook.js.org/">Storybook</a>.
                </LinkItem>
                <LinkItem>
                  <h3>
                    <a href={`${PUBLIC_URL}/playwright-report`}>
                      E2E Test Report
                    </a>
                  </h3>
                  The report from the most recent{" "}
                  <a href="https://playwright.dev/">Playwright</a> E2E testing
                  run.
                </LinkItem>
              </Links>
            </Grid>
          </Page>
        ),
      },
    ],
  },
]

const router = createBrowserRouter(routes, {
  basename: PUBLIC_URL,
})

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App

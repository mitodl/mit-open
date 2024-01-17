import React from "react"
import Header from "./Header"
import { Grid, ThemeProvider, styled } from "ol-components"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { RouteObject, Outlet } from "react-router"
import "./style.css"

const PUBLIC_URL = process.env.PUBLIC_URL || ""

const Page = styled.div`
  margin: auto;
  max-width: 1200px;
`

const PageTitle = styled.h1`
  margin-top: 6rem;
  margin-bottom: 0.5rem;
  font-size: 50px;
  color: ${({ theme }) => theme.custom.colorBlue5};
`

const Links = styled.div`
  margin-top: 4rem;

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
              <PageTitle>Developer Materials</PageTitle>
              <h2>
                Libraries and tools for application development for use in your
                projects
              </h2>
              <Links>
                <h3>
                  <a href={`${PUBLIC_URL}/storybook`}>
                    React Component Library
                  </a>
                </h3>
                MIT Open Learning's React component library, presented with{" "}
                <a href="https://storybook.js.org/">Storybook</a>.
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

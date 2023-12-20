import React from "react"
import { RouteObject, Outlet, LayoutRouteProps } from "react-router"
import { useLocation } from "react-router-dom"
import HomePage from "@/pages/HomePage/HomePage"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import LearningPathListingPage from "@/pages/LearningPathListingPage/LearningPathListingPage"
import LearningPathDetailsPage from "@/pages/LearningPathDetailsPage/LearningPathDetailsPage"
import ArticleDetailsPage from "@/pages/ArticleDetailsPage/ArticleDetailsPage"
import { ArticleCreatePage, ArticleEditPage } from "@/pages/ArticleUpsertPages"
import ErrorPage from "@/pages/ErrorPage/ErrorPage"
import * as urls from "@/common/urls"
import Header from "@/page-components/Header/Header"
import { Permissions } from "@/common/permissions"
import UserWidget from "./pages/User/UserWidget"
import ZoidUserWidget from "./pages/User/ZoidUserWidget"

const HeaderWrapper = ({ children }: LayoutRouteProps) => {
  const { pathname } = useLocation()
  const widgetsPathRegex = /^(?!.*widgets\/).*$/

  const isValid = widgetsPathRegex.test(pathname)
  return isValid ? children : null
}

const routes: RouteObject[] = [
  {
    element: (
      <>
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <Outlet />
      </>
    ),
    errorElement: <ErrorPage />,
    // Rendered into the Outlet above
    children: [
      {
        path: urls.HOME,
        element: <HomePage />,
      },
      {
        path: urls.LEARNINGPATH_LISTING,
        element: <LearningPathListingPage />,
      },
      {
        path: urls.LEARNINGPATH_VIEW,
        element: <LearningPathDetailsPage />,
      },
      {
        element: <RestrictedRoute requires={Permissions.ArticleEditor} />,
        children: [
          {
            path: urls.ARTICLES_DETAILS,
            element: <ArticleDetailsPage />,
          },
          {
            path: urls.ARTICLES_EDIT,
            element: <ArticleEditPage />,
          },
          {
            path: urls.ARTICLES_CREATE,
            element: <ArticleCreatePage />,
          },
        ],
      },
      {
        path: urls.USER_WIDGET,
        element: <UserWidget />,
      },
      {
        path: urls.ZOID_USER_WIDGET,
        element: <ZoidUserWidget />,
      },
    ],
  },
]

export default routes

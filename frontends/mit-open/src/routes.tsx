import React from "react"
import { RouteObject, Outlet } from "react-router"
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

const routes: RouteObject[] = [
  {
    element: (
      <>
        <Header />
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
    ],
  },
]

export default routes

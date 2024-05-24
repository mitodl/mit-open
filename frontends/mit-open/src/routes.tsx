import React from "react"
import { RouteObject, Outlet } from "react-router"
import HomePage from "@/pages/HomePage/HomePage"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import LearningPathListingPage from "@/pages/LearningPathListingPage/LearningPathListingPage"
import FieldPage from "@/pages/FieldPage/FieldPage"
import EditFieldPage from "@/pages/FieldPage/EditFieldPage"

import UserListListingPage from "./pages/UserListListingPage/UserListListingPage"
import ArticleDetailsPage from "@/pages/ArticleDetailsPage/ArticleDetailsPage"
import { ArticleCreatePage, ArticleEditPage } from "@/pages/ArticleUpsertPages"
import ProgramLetterPage from "@/pages/ProgramLetterPage/ProgramLetterPage"
import DashboardPage from "@/pages/DashboardPage/DashboardPage"
import AboutPage from "@/pages/AboutPage/AboutPage"
import AccessibilityPage from "@/pages/AccessibilityPage/AccessibilityPage"
import PrivacyPage from "@/pages/PrivacyPage/PrivacyPage"
import TermsPage from "@/pages/TermsPage/TermsPage"
import ContactPage from "@/pages/ContactPage/ContactPage"
import ErrorPage from "@/pages/ErrorPage/ErrorPage"
import * as urls from "@/common/urls"
import Header from "@/page-components/Header/Header"
import Footer from "@/page-components/Footer/Footer"
import { Permissions } from "@/common/permissions"
import SearchPage from "./pages/SearchPage/SearchPage"
import UserListDetailsPage from "./pages/ListDetailsPage/UserListDetailsPage"
import LearningPathDetailsPage from "./pages/ListDetailsPage/LearningPathDetailsPage"
import LearningResourceDrawer from "./page-components/LearningResourceDrawer/LearningResourceDrawer"
import DepartmentListingPage from "./pages/DepartmentListingPage/DepartmentListingPage"
import TopicsListingPage from "./pages/TopicListingPage/TopicsListingPage"

const routes: RouteObject[] = [
  {
    element: (
      <>
        <Header />
        <Outlet />
        <LearningResourceDrawer />
        <Footer />
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
        path: urls.USERLIST_LISTING,
        element: (
          <RestrictedRoute requires={Permissions.Authenticated}>
            <UserListListingPage />
          </RestrictedRoute>
        ),
      },
      {
        path: urls.USERLIST_VIEW,
        element: (
          <RestrictedRoute requires={Permissions.Authenticated}>
            <UserListDetailsPage />
          </RestrictedRoute>
        ),
      },
      {
        path: urls.DASHBOARD,
        element: (
          <RestrictedRoute requires={Permissions.Authenticated}>
            <DashboardPage />
          </RestrictedRoute>
        ),
      },
      {
        path: urls.ABOUT,
        element: <AboutPage />,
      },
      {
        path: urls.ACCESSIBILITY,
        element: <AccessibilityPage />,
      },
      {
        path: urls.PRIVACY,
        element: <PrivacyPage />,
      },
      {
        path: urls.TERMS,
        element: <TermsPage />,
      },
      {
        path: urls.CONTACT,
        element: <ContactPage />,
      },
      {
        path: urls.PROGRAMLETTER_VIEW,
        element: <ProgramLetterPage />,
      },
      {
        path: urls.SEARCH,
        element: <SearchPage />,
      },
      {
        path: urls.DEPARTMENTS,
        element: <DepartmentListingPage />,
      },
      {
        path: urls.TOPICS,
        element: <TopicsListingPage />,
      },
      {
        path: urls.FIELD_VIEW,
        element: <FieldPage />,
      },
      {
        path: urls.FIELD_EDIT_WIDGETS,
        element: <FieldPage />,
      },
      {
        path: urls.FIELD_EDIT,
        element: <EditFieldPage />,
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

import React from "react"
import { RouteObject, Outlet } from "react-router"
import { ScrollRestoration } from "react-router-dom"
import HomePage from "@/pages/HomePage/HomePage"
import RestrictedRoute from "@/components/RestrictedRoute/RestrictedRoute"
import LearningPathListingPage from "@/pages/LearningPathListingPage/LearningPathListingPage"
import ChannelPage from "@/pages/ChannelPage/ChannelPage"
import EditChannelPage from "@/pages/ChannelPage/EditChannelPage"

import { UserListListingPage } from "./pages/UserListListingPage/UserListListingPage"
import ArticleDetailsPage from "@/pages/ArticleDetailsPage/ArticleDetailsPage"
import { ArticleCreatePage, ArticleEditPage } from "@/pages/ArticleUpsertPages"
import ProgramLetterPage from "@/pages/ProgramLetterPage/ProgramLetterPage"
import { DashboardPage } from "@/pages/DashboardPage/DashboardPage"
import { AboutPage } from "@/pages/AboutPage/AboutPage"
import PrivacyPage from "@/pages/PrivacyPage/PrivacyPage"
import TermsPage from "@/pages/TermsPage/TermsPage"
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
import UnitsListingPage from "./pages/UnitsListingPage/UnitsListingPage"
import OnboardingPage from "./pages/OnboardingPage/OnboardingPage"

import { styled } from "ol-components"

const PageWrapper = styled.div({
  height: "calc(100vh - 80px)",
  display: "flex",
  flexDirection: "column",
})

const PageWrapperInner = styled.div({
  flex: "1",
})

const routes: RouteObject[] = [
  {
    element: (
      <>
        <PageWrapper>
          <Header />
          <PageWrapperInner>
            <ScrollRestoration
              getKey={(location) => {
                return location.pathname
              }}
            />
            <Outlet />
          </PageWrapperInner>
          <Footer />
        </PageWrapper>
        <LearningResourceDrawer />
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
        path: urls.ONBOARDING,
        element: (
          <RestrictedRoute requires={Permissions.Authenticated}>
            <OnboardingPage />
          </RestrictedRoute>
        ),
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
        path: urls.PRIVACY,
        element: <PrivacyPage />,
      },
      {
        path: urls.TERMS,
        element: <TermsPage />,
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
        path: urls.UNITS,
        element: <UnitsListingPage />,
      },
      {
        path: urls.CHANNEL_VIEW,
        element: <ChannelPage />,
      },
      {
        path: urls.CHANNEL_EDIT_WIDGETS,
        element: <ChannelPage />,
      },
      {
        path: urls.CHANNEL_EDIT,
        element: <EditChannelPage />,
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

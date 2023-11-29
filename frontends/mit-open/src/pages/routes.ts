import { RouteProps } from "react-router"
import HomePage from "./Home"
import LearningPathListingPage from "./learningpaths/LearningPathListingPage"
import LearningPathDetailsPage from "./learningpaths/LearningPathDetails"
import ArticleDetailsPage from "./articles/ArticleDetailsPage"
import {
  ArticleEditingPage,
  ArticlesCreatePage,
} from "./articles/ArticleUpsertPages"
import * as urls from "./urls"

const routes: RouteProps[] = [
  {
    path: urls.HOME,
    component: HomePage,
    exact: true,
  },
  {
    path: urls.LEARNINGPATH_LISTING,
    component: LearningPathListingPage,
    exact: true,
  },
  {
    path: urls.LEARNINGPATH_VIEW,
    component: LearningPathDetailsPage,
    exact: true,
  },
  {
    path: urls.ARTICLES_CREATE,
    component: ArticlesCreatePage,
    exact: true,
  },
  {
    path: urls.ARTICLES_DETAILS,
    component: ArticleDetailsPage,
    exact: true,
  },
  {
    path: urls.ARTICLES_EDIT,
    component: ArticleEditingPage,
    exact: true,
  },
]

export default routes

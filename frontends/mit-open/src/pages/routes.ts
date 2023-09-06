import { RouteProps } from "react-router"
import HomePage from "./Home"
import LearningPathListingPage from "./learningpaths/LearningPathListingPage"
import LearningPathDetailsPage from "./learningpaths/LearningPathDetails"
import * as urls from "./urls"

const routes: RouteProps[] = [
  {
    path:      urls.HOME,
    component: HomePage,
    exact:     true
  },
  {
    path:      urls.LEARNINGPATH_LISTING,
    component: LearningPathListingPage,
    exact:     true
  },
  {
    path:      urls.LEARNINGPATH_VIEW,
    component: LearningPathDetailsPage,
    exact:     true
  }
]

export default routes

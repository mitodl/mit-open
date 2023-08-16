import { RouteProps } from "react-router"
import * as urls from "./urls"
import ArticlePage from "./ArticlePage"
import DemoPage from "./DemoPage"
import HomePage from "./HomePage"
import SearchPage from "./SearchPage"
import FieldAdminApp from "./field-details/FieldAdminApp"
import FieldPage from "./field-details/FieldPage"
import FavoritesPage from "./resource-lists/FavoritesPage"
import {
  UserListDetailsPage,
  StaffListDetailsPage
} from "./resource-lists/ResourceListDetailsPage"
import {
  UserListsListingPage,
  StaffListsListingPage
} from "./resource-lists/ResourceListsListingsPage"

const routes: RouteProps[] = [
  {
    path:      urls.HOME,
    exact:     true,
    component: HomePage
  },
  {
    path:      urls.SEARCH,
    component: SearchPage,
    exact:     true
  },
  {
    path:      urls.DEMO,
    component: DemoPage,
    exact:     true
  },
  {
    path:      [urls.FIELD_VIEW, urls.FIELD_EDIT_WIDGETS],
    component: FieldPage,
    exact:     true
  },
  {
    path:      urls.FIELD_EDIT,
    component: FieldAdminApp,
    exact:     true
  },
  {
    path:      urls.USERLISTS_LISTING,
    component: UserListsListingPage,
    exact:     true
  },
  {
    path:      urls.FAVORITES_VIEW,
    component: FavoritesPage,
    exact:     true
  },
  {
    path:      urls.USERLIST_VIEW,
    component: UserListDetailsPage,
    exact:     true
  },
  {
    path:      urls.STAFFLISTS_LISTING,
    component: StaffListsListingPage,
    exact:     true
  },
  {
    path:      urls.STAFFLIST_VIEW,
    component: StaffListDetailsPage,
    exact:     true
  },
  {
    path:      "/infinite/article",
    component: ArticlePage,
    exact:     true
  }
]

export default routes

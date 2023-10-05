import { RouteProps } from "react-router"
import * as urls from "./urls"
import DemoPage from "./DemoPage"
import SearchPage from "./SearchPage"
import FieldAdminApp from "./field-details/FieldAdminApp"
import FieldPage from "./field-details/FieldPage"

const routes: RouteProps[] = [
  {
    path: urls.HOME,
    exact: true,
  },
  {
    path: urls.SEARCH,
    component: SearchPage,
    exact: true,
  },
  {
    path: urls.DEMO,
    component: DemoPage,
    exact: true,
  },
  {
    path: [urls.FIELD_VIEW, urls.FIELD_EDIT_WIDGETS],
    component: FieldPage,
    exact: true,
  },
  {
    path: urls.FIELD_EDIT,
    component: FieldAdminApp,
    exact: true,
  },
]

export default routes

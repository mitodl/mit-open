import { RouteProps } from "react-router"
import HomePage from "./Home"

const routes: RouteProps[] = [
  {
    path:      "/",
    component: HomePage,
    exact:     true
  }
]

export default routes

import { generatePath } from "react-router"

export const HOME = "/"

export const LEARNINGPATH_LISTING = "/learningpaths/"
export const LEARNINGPATH_VIEW = "/learningpaths/:id"
export const learningPathsView = (id: number) =>
  generatePath(LEARNINGPATH_VIEW, { id })

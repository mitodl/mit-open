import { generatePath } from "react-router"

export const HOME = "/"

export const LEARNINGPATH_LISTING = "/learningpaths/"
export const LEARNINGPATH_VIEW = "/learningpaths/:id"
export const learningPathsView = (id: number) =>
  generatePath(LEARNINGPATH_VIEW, { id: String(id) })
export const USERLIST_LISTING = "/userlists/"
export const USERLIST_VIEW = "/userlists/:id"
export const userListView = (id: number) =>
  generatePath(USERLIST_VIEW, { id: String(id) })
export const PROGRAMLETTER_VIEW = "/program_letter/:id/view/"
export const programLetterView = (id: string) =>
  generatePath(PROGRAMLETTER_VIEW, { id: String(id) })
export const ARTICLES_LISTING = "/articles/"
export const ARTICLES_DETAILS = "/articles/:id"
export const ARTICLES_EDIT = "/articles/:id/edit"
export const ARTICLES_CREATE = "/articles/new"
export const articlesView = (id: number) =>
  generatePath(ARTICLES_DETAILS, { id: String(id) })
export const articlesEditView = (id: number) =>
  generatePath(ARTICLES_EDIT, { id: String(id) })

export const DEPARTMENTS = "/departments/"

export const FIELD_VIEW = "/c/:channelType/:name" as const
export const FIELD_EDIT = "/c/:channelType/:name/manage/" as const
export const FIELD_EDIT_WIDGETS =
  "/c/:channelType/:name/manage/widgets/" as const
export const makeFieldViewPath = (channelType: string, name: string) =>
  generatePath(FIELD_VIEW, { channelType, name })
export const makeFieldEditPath = (channelType: string, name: string) =>
  generatePath(FIELD_EDIT, { channelType, name })
export const makeFieldManageWidgetsPath = (channelType: string, name: string) =>
  generatePath(FIELD_EDIT_WIDGETS, { channelType, name })

export const LOGIN = "/login/ol-oidc/"
export const LOGOUT = "/logout/"

/**
 * Returns the URL to the login page, with a `next` parameter to redirect back
 * to the given pathname + search parameters.
 */
export const login = ({
  pathname = "/",
  search = "",
}: {
  pathname?: string
  search?: string
} = {}) => {
  /**
   * To include search parameters in the next URL, we need to encode them.
   * If we pass `?next=/foo/bar?cat=meow` directly, Django receives two separate
   * parameters: `next` and `cat`.
   *
   * There's no need to encode the path parameter (it might contain slashes,
   * but those are allowed in search parameters) so let's keep it readable.
   */
  const next = `${pathname}${encodeURIComponent(search)}`
  return `${LOGIN}?next=${next}`
}

export const DASHBOARD = "/dashboard/"

export const SEARCH = "/search/"

export const DEPARTMENTS = "/departments/"

export const RESOURCE_DRAWER_QUERY_PARAM = "resource"

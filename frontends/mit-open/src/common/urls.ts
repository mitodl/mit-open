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

export const FIELD_VIEW = "/fields/:name/" as const
export const FIELD_EDIT = "/fields/:name/manage/" as const
export const FIELD_EDIT_WIDGETS = "/fields/:name/manage/widgets/" as const
export const makeFieldViewPath = (name: string) =>
  generatePath(FIELD_VIEW, { name })
export const makeFieldEditPath = (name: string) =>
  generatePath(FIELD_EDIT, { name })
export const makeFieldManageWidgetsPath = (name: string) =>
  generatePath(FIELD_EDIT_WIDGETS, { name })

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

export const RESOURCE_DRAWER_QUERY_PARAM = "resource"

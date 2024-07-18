import { generatePath } from "react-router"

export const HOME = "/"

export const ONBOARDING = "/onboarding"

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
export const TOPICS = "/topics/"

export const CHANNEL_VIEW = "/c/:channelType/:name" as const
export const CHANNEL_EDIT = "/c/:channelType/:name/manage/" as const
export const CHANNEL_EDIT_WIDGETS =
  "/c/:channelType/:name/manage/widgets/" as const
export const makeChannelViewPath = (channelType: string, name: string) =>
  generatePath(CHANNEL_VIEW, { channelType, name })
export const makeChannelEditPath = (channelType: string, name: string) =>
  generatePath(CHANNEL_EDIT, { channelType, name })
export const makeChannelManageWidgetsPath = (
  channelType: string,
  name: string,
) => generatePath(CHANNEL_EDIT_WIDGETS, { channelType, name })

export const LOGIN = `${process.env.MITOPEN_API_BASE_URL}/login/ol-oidc/`
export const LOGOUT = `${process.env.MITOPEN_API_BASE_URL}/logout/`

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
  const next = `${window.location.origin}${pathname}${encodeURIComponent(search)}`
  return `${LOGIN}?next=${next}`
}

export const next = () => {
  const path = window.location.pathname
  const search = window.location.search
  const hash = window.location.hash
  return encodeURIComponent(`${path}${search}${hash}`)
}

export const DASHBOARD = "/dashboard/"

export const SEARCH = "/search/"

export const ABOUT = "/about/"

export const ACCESSIBILITY = "https://accessibility.mit.edu/"

export const PRIVACY = "/privacy/"

export const TERMS = "/terms/"

export const UNITS = "/units/"

export const CONTACT = "mailto:odl-discussions-support@mit.edu"

export const RESOURCE_DRAWER_QUERY_PARAM = "resource"

export const querifiedSearchUrl = (
  params:
    | string
    | string[][]
    | URLSearchParams
    | Record<string, string>
    | undefined,
) => `${SEARCH}?${new URLSearchParams(params).toString()}`

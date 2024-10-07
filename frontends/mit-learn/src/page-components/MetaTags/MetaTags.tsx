import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import React from "react"
import { Helmet } from "react-helmet-async"
import { useLocation } from "react-router"
import invariant from "tiny-invariant"

type MetaTagsProps = {
  title?: string
  description?: string | null
  image?: string
  imageAlt?: string | null
  canonicalLink?: string
  children?: React.ReactNode
  social?: boolean
  /**
   * Keeps <MetaTags> rendered when resource drawer is open.
   *
   * tldr: Set `isResourceDrawer={true}` if this MetaTags component is used in
   * the resource drawer. Otherwise, the MetaTags component will be unmounted
   * when resource drawer is open.
   *
   * Full story: `react-helmet-async` tries to intelligently deduplicate the
   * meta tags. Precedence is given to the most recently INITIALIZED instance of
   * <Helmet /> (Not the most recently rendered).
   *
   * If the helmets are:
   * <SomeComponent>
   *   <FooComponent>
   *    <Helmet title="A" />
   *   </FooComponent>
   *   <Helmet title="B" />
   *   <OtherComponent>
   *     <Helmet title="C" />
   *     <OneMoreComponent>
   *      <Helmet title="D" />
   *    </OneMoreComponent>
   *   </OtherComponent>
   * </SomeComponent>
   *
   * Then "D" will be the title, because it is the most recently initialized.
   * Even if FooComponent re-renders its Helmet with a new title, then "D" will
   * still be the title because initialization order matters, not render order.
   *
   * This generally leads to exactly the behavior you would want: Pages can each
   * have their own Helmet instances, and child components within a Page can add
   * their own metadata tags with higher precedence, since the children will
   * initialize after the parent.
   *
   * HOWEVER: The resource drawer is not a child of any particular page. It's
   * a modal drawer that is available on ALL pages:
   *  <AppProviders>
   *    <PageOne />
   *    <PageTwo />
   *    <Etc />
   *    <ResourceDrawer />
   *  </AppProviders>
   *
   * Because the resource drawer is not a child of any particular page, its
   * Helmet instance might initialze before or after PageOne's Helmet (depending
   * on whether the page waits for a data fetch or not.)
   *
   * In order to guarantee that the resource drawer's Helmet instance is
   * initialized last, we unmount all other Helmet instances when the drawer is
   * open.
   */
  isResourceDrawer?: boolean
}

const canonicalPathname = (pathname: string) => {
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

const SITE_NAME = APP_SETTINGS.SITE_NAME
const DEFAULT_OG_IMAGE = `${window.origin}/static/images/learn-og-image.jpg`
/**
 * Renders a Helmet component to customize meta tags
 */
const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  children,
  social = true,
  isResourceDrawer,
}) => {
  const location = useLocation()

  const searchString = location.search === "?" ? "" : location.search
  const canonical = new URL(
    canonicalPathname(location.pathname) + searchString,
    window.location.origin,
  ).toString()

  const isResourceDrawerOpen = new URLSearchParams(location.search).has(
    RESOURCE_DRAWER_QUERY_PARAM,
  )

  const fullTitle = `${title} | ${SITE_NAME}`

  if (process.env.NODE_ENV === "development" && image) {
    try {
      new URL(image)
    } catch {
      throw new Error("og:image must be a full URL, including protocol")
    }
    invariant(!image.endsWith(".svg"), "og:image must not be an SVG")
  }

  if (isResourceDrawerOpen && !isResourceDrawer) {
    return null
  }

  return (
    <Helmet>
      {title && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {/*
      react-helmet-async does not allow fragments as children
      */}
      {social && <meta property="og:type" content="website" />}
      {social && <meta property="og:site_name" content={SITE_NAME} />}
      {social && <meta property="og:image" content={image} />}
      {social && title && <meta property="og:title" content={fullTitle} />}
      {social && imageAlt && (
        <meta property="og:image:alt" content={imageAlt} />
      )}
      {social && <meta property="og:url" content={canonical} />}
      {social && description && (
        <meta property="og:description" content={description} />
      )}
      {social && <meta name="twitter:card" content="summary_large_image" />}
      {social && <meta name="twitter:image:src" content={image} />}
      {social && description && (
        <meta name="twitter:description" content={description} />
      )}
      {children}
    </Helmet>
  )
}

export default MetaTags

import React, { useMemo } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation } from "react-router"
import invariant from "tiny-invariant"

type MetaTagsProps = {
  title?: string | string[]
  titlePrependSiteName?: boolean
  description?: string | null
  image?: string
  imageAlt?: string | null
  canonicalLink?: string
  children?: React.ReactNode
}

const canonicalPathname = (pathname: string) => {
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

const SITE_NAME = APP_SETTINGS.SITE_NAME
const DEFAULT_OG_IMAGE = `${window.origin}/staic/images/default_og_image.png`
/**
 * Renders a Helmet component to customize meta tags
 */
const MetaSocialSeo: React.FC<MetaTagsProps> = ({
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  children,
  titlePrependSiteName = true,
}) => {
  const location = useLocation()
  const canonical = new URL(
    canonicalPathname(location.pathname) + location.search
      ? `?${location.search}`
      : "",
    window.location.origin,
  ).toString()

  const fullTitle = useMemo(() => {
    const pieces = Array.isArray(title) ? title : [title]
    return titlePrependSiteName ? [pieces, SITE_NAME] : pieces
  }, [title, titlePrependSiteName]).join(" | ")

  if (process.env.NODE_ENV === "development" && image) {
    try {
      new URL(image)
    } catch {
      throw new Error("og:image must be a full URL, including protocol")
    }
    invariant(!image.endsWith(".svg"), "og:image must not be an SVG")
  }

  return (
    <Helmet>
      {title && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />
      {title && <meta property="og:title" content={fullTitle} />}
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:url" content={canonical} />
      {description && <meta property="og:description" content={description} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image:src" content={image} />
      {description && <meta name="twitter:description" content={description} />}

      {children}
    </Helmet>
  )
}

export default MetaSocialSeo

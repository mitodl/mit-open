import React from "react"
import { Helmet } from "react-helmet-async"
import { useLocation } from "react-router"
import invariant from "tiny-invariant"

type MetaTagsProps = {
  title?: string | string[]
  description?: string | null
  image?: string
  imageAlt?: string | null
  canonicalLink?: string
  children?: React.ReactNode
  social?: boolean
}

const canonicalPathname = (pathname: string) => {
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

const SITE_NAME = APP_SETTINGS.SITE_NAME
const DEFAULT_OG_IMAGE = `${window.origin}/staic/images/default_og_image.png`
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
}) => {
  const location = useLocation()
  const canonical = new URL(
    canonicalPathname(location.pathname) + location.search
      ? `?${location.search}`
      : "",
    window.location.origin,
  ).toString()

  const fullTitle = `${title} | ${SITE_NAME}`

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
      {description && <meta name="twitter:description" content={description} />}
      {children}
    </Helmet>
  )
}

export default MetaTags

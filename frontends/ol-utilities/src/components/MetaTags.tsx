"use client"

import React from "react"
import { Helmet } from "react-helmet-async"

type MetaTagsProps = {
  title?: string | string[]
  canonicalLink?: string
  children?: React.ReactNode
}

const removeTrailingSlash = (str: string): string =>
  str.length > 0 && str.endsWith("/") ? str.substring(0, str.length - 1) : str

const getCanonicalUrl = (url: string): string => {
  const href = removeTrailingSlash(String(new URL(url, window.location.origin)))
  return href
}

/**
 * Renders a Helmet component to customize meta tags
 */
const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  children,
  canonicalLink,
}) => {
  title = title ? (Array.isArray(title) ? title : [title]) : []

  return (
    <Helmet>
      <title>{[...title, APP_SETTINGS.SITE_NAME].join(" | ")}</title>
      {children}
      {canonicalLink ? (
        <link rel="canonical" href={getCanonicalUrl(canonicalLink)} />
      ) : null}
    </Helmet>
  )
}

export default MetaTags

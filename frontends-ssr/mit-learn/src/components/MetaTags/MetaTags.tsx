"use client"

import React from "react"
// import { Helmet } from "react-helmet-async"
import Head from "next/head"

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
 * Renders a Next.js head component to customize meta tags
 */
const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  children,
  canonicalLink,
}) => {
  title = title ? (Array.isArray(title) ? title : [title]) : []

  return (
    <Head>
      <title>{[...title, process.env.NEXT_PUBLIC_SITE_NAME].join(" | ")}</title>
      {children}
      {canonicalLink ? (
        <link rel="canonical" href={getCanonicalUrl(canonicalLink)} />
      ) : null}
    </Head>
  )
}

export default MetaTags


import React from "react"
// import { Helmet } from "react-helmet-async"
import Head from "next/head"

type MetaTagsProps = {
  title?: string | string[]
  canonicalLink?: string
  children?: React.ReactNode
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
        <link rel="canonical" href={process.env.NEXT_PUBLIC_ORIGIN} />
      ) : null}
    </Head>
  )
}

export default MetaTags

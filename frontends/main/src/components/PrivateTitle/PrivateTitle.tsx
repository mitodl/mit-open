import React from "react"

/**
 * Alert! Prefer the nextjs [metadata api](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
 * This is intended for rendering titles that require authentication and hence
 * can't be rendered on our nextjs server.
 *
 * Render a title tag. Will be hoisted to <head> by React.
 * See [title](https://react.dev/reference/react-dom/components/title)
 */
const PrivateTitle: React.FC<{ title: string }> = ({ title }) => {
  return <title>{[title, process.env.NEXT_PUBLIC_SITE_NAME].join(" | ")}</title>
}

export default PrivateTitle

// https://tanstack.com/query/v4/docs/framework/react/guides/ssr#using-hydrate

import { QueryClient } from "api/ssr"
// import { cache } from "react"

/*
 * Using cache()  Errors with:
 * Error occurred prerendering page "/about". Read more: https://nextjs.org/docs/messages/prerender-error
      Error: Not implemented.
    at Object.getCacheForType
    https://github.com/vercel/next.js/issues/57205
 */
// const getQueryClient = cache(() => new QueryClient())

// TODO We need to ensure this is called only once per request
const getQueryClient = () => new QueryClient()

export default getQueryClient

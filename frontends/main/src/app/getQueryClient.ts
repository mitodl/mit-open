// https://tanstack.com/query/v4/docs/framework/react/guides/ssr#using-hydrate

import { QueryClient } from "api/ssr"
import { cache } from "react"

const getQueryClient = cache(() => new QueryClient())
export default getQueryClient

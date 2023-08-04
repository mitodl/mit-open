import createClient from "openapi-fetch"
import { paths } from "./schema"

const client = createClient<paths>()

const { data } = await client.GET("/api/v0/fields/", { params: {} })
import type { LearningResource } from "api"

const readableResourceTypes: Record<string, string> = {
  course:  "Course",
  program: "Program"
}
const getReadableResourceType = (
  resource: Pick<LearningResource, "resource_type">
): string => {
  const readable = readableResourceTypes[resource.resource_type]
  if (!readable) {
    throw new Error(`Unknown resource type: ${resource.resource_type}`)
  }
  return readable
}

const BLANK_THUMBNAIL = new URL(
  "/static/images/blank.png",
  window.location.origin
).toString()

type EmbedlyConfig = {
  key: string
  width: number
  height: number
}

const embedlyThumbnail = (url: string, { key, width, height }: EmbedlyConfig) =>
  `https://i.embed.ly/1/display/crop/?key=${key}&url=${encodeURIComponent(
    url
  )}&height=${height}&width=${width}&grow=true&animate=false&errorurl=${BLANK_THUMBNAIL}`

const DEFAULT_RESOURCE_IMG = new URL(
  "/static/images/default_resource_thumb.jpg",
  window.location.origin
).toString()

const resourceThumbnailSrc = (
  resource: Pick<LearningResource, "image">,
  config: EmbedlyConfig
) => embedlyThumbnail(resource.image?.url ?? DEFAULT_RESOURCE_IMG, config)

export { resourceThumbnailSrc, getReadableResourceType }
export type { EmbedlyConfig }

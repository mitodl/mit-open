import moment from "moment"
import type { LearningResource, LearningResourceRun } from "api"
import { ResourceTypeEnum } from "api"

const readableResourceTypes: Record<ResourceTypeEnum, string> = {
  [ResourceTypeEnum.Course]: "Course",
  [ResourceTypeEnum.Program]: "Program",
  [ResourceTypeEnum.LearningPath]: "Learning Path",
  [ResourceTypeEnum.Podcast]: "Podcast",
  [ResourceTypeEnum.PodcastEpisode]: "Podcast Episode",
  [ResourceTypeEnum.Video]: "Video",
  [ResourceTypeEnum.VideoPlaylist]: "Video Playlist",
}
const getReadableResourceType = (
  resource: Pick<LearningResource, "resource_type">,
): string => readableResourceTypes[resource.resource_type]

const BLANK_THUMBNAIL = new URL(
  "/static/images/blank.png",
  window.location.origin,
).toString()

const embedlyThumbnail = (url: string, { key, width, height }: EmbedlyConfig) =>
  `https://i.embed.ly/1/display/crop/?key=${key}&url=${encodeURIComponent(
    url,
  )}&height=${height}&width=${width}&grow=true&animate=false&errorurl=${BLANK_THUMBNAIL}`

const DEFAULT_RESOURCE_IMG = new URL(
  "/static/images/default_resource_thumb.jpg",
  window.location.origin,
).toString()

type EmbedlyConfig = {
  key: string
  width: number
  height: number
}

const resourceThumbnailSrc = (
  image: LearningResource["image"],
  config: EmbedlyConfig,
) => embedlyThumbnail(image?.url ?? DEFAULT_RESOURCE_IMG, config)

const DATE_FORMAT = "YYYY-MM-DD[T]HH:mm:ss[Z]"
/**
 * Parse date string into a moment object.
 *
 * If date is null or undefined, a Moment<Invalid date> object is returned.
 * Invalid dates return false for all comparisons.
 */
const asMoment = (date?: string | null) => moment(date, DATE_FORMAT)
const isCurrent = (run: LearningResourceRun) =>
  asMoment(run.start_date).isSameOrBefore() && asMoment(run.end_date).isAfter()

/**
 * Sort dates descending, with invalid dates last.
 */
const datesDescendingSort = (
  aString: string | null | undefined,
  bString: string | null | undefined,
) => {
  const a = asMoment(aString)
  const b = asMoment(bString)
  // if both invalid, tie
  if (!a.isValid() && !b.isValid()) return 0
  // if only one invalid, the other is better
  if (!a.isValid()) return 1
  if (!b.isValid()) return -1
  // if both valid, sort descending
  return -a.diff(b)
}

/**
 * Find "best" running: prefer current, then nearest future, then nearest past.
 */
const findBestRun = (
  runs: LearningResourceRun[],
): LearningResourceRun | undefined => {
  const sorted = runs.sort((a, b) =>
    datesDescendingSort(a.start_date, b.start_date),
  )

  const current = sorted.find(isCurrent)
  if (current) return current

  // Closest to now will be last in the sorted array
  const future = sorted.filter((run) =>
    asMoment(run.start_date).isSameOrAfter(),
  )
  if (future.length > 0) return future[future.length - 1]

  // Closest to now will be first in the sorted array
  const past = sorted.filter((run) => asMoment(run.start_date).isBefore())
  return past[0] ?? sorted[0]
}

export { resourceThumbnailSrc, getReadableResourceType, findBestRun }
export type { EmbedlyConfig }

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
const getReadableResourceType = (resourceType: ResourceTypeEnum): string =>
  readableResourceTypes[resourceType]

const BLANK_IMAGE = "https://rc.learn.mit.edu/static/images/blank.png"

const embedlyCroppedImage = (
  url: string,
  { key, width, height }: EmbedlyConfig,
) =>
  `https://i.embed.ly/1/display/crop/?key=${key}&url=${encodeURIComponent(
    url,
  )}&height=${height}&width=${width}&grow=true&animate=false&errorurl=${BLANK_IMAGE}`

const DEFAULT_RESOURCE_IMG = "/static/images/default_resource.jpg"

type EmbedlyConfig = {
  key: string
  width: number
  height: number
}

const resourceThumbnailSrc = (
  image: LearningResource["image"],
  config: EmbedlyConfig,
) => embedlyCroppedImage(image?.url ?? DEFAULT_RESOURCE_IMG, config)

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

export {
  DEFAULT_RESOURCE_IMG,
  embedlyCroppedImage,
  resourceThumbnailSrc,
  getReadableResourceType,
  findBestRun,
}
export type { EmbedlyConfig }

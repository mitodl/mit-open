import { ChannelCounts } from "api/v0"
const getSearchParamMap = (urlParams: URLSearchParams) => {
  const params: Record<string, string[] | string> = {}
  for (const [key] of urlParams.entries()) {
    params[key] = urlParams.getAll(key)
  }
  return params
}

const aggregateProgramCounts = (
  groupBy: string,
  data: Array<ChannelCounts>,
): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(data).map(([_key, value]) => {
      return [value[groupBy as keyof ChannelCounts], value.counts.programs]
    }),
  )
}

const aggregateCourseCounts = (
  groupBy: string,
  data: Array<ChannelCounts>,
): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(data).map(([_key, value]) => {
      return [value[groupBy as keyof ChannelCounts], value.counts.courses]
    }),
  )
}

export { getSearchParamMap, aggregateProgramCounts, aggregateCourseCounts }

//@flow
import R from "ramda"
import moment from "moment"

import {
  COURSE_ARCHIVED,
  COURSE_AVAILABLE_NOW,
  COURSE_CURRENT,
  COURSE_PRIOR,
  DATE_FORMAT,
  DEFAULT_END_DT,
  DEFAULT_START_DT,
  LR_TYPE_USERLIST,
  LR_TYPE_LEARNINGPATH,
  LR_TYPE_PROGRAM,
  LR_TYPE_COURSE,
  platforms
} from "./constants"

import { capitalize, emptyOrNil, formatPrice } from "./util"

import type {
  LearningResourceRun,
  CourseInstructor,
  CoursePrice
} from "../flow/discussionTypes"

export const AVAILABLE_NOW = "availableNow"

export const AVAILABILITY_MAPPING = {
  [AVAILABLE_NOW]: {
    label:  "Available Now",
    filter: { to: "now" }
  },
  ["nextWeek"]: {
    label:  "Within next week",
    filter: { from: "now", to: "now+7d" }
  },
  ["nextMonth"]: {
    label:  "Within next month",
    filter: { from: "now", to: "now+1M" }
  },
  ["next3Months"]: {
    label:  "Within next 3 months",
    filter: { from: "now", to: "now+3M" }
  },
  ["next6Months"]: {
    label:  "Within next 6 months",
    filter: { from: "now", to: "now+6M" }
  },
  ["nextYear"]: {
    label:  "Within next year",
    filter: { from: "now", to: "now+12M" }
  }
}

export const availabilityLabel = (availability: ?string) => {
  switch (availability) {
  case COURSE_CURRENT:
    return COURSE_AVAILABLE_NOW
  case COURSE_ARCHIVED:
    return COURSE_PRIOR
  default:
    return availability
  }
}

export const availabilityFilterToMoment = (filter: string, ending: boolean) => {
  // Convert an Elasticsearch date_range filter string to a moment, assuming
  // the filter is defined. For example, 'from' is undefined for 'Available Now'
  // because any start date before today qualifies.
  const format = /(now)(\+)?(\d+)?([Md])?/
  const match = format.exec(filter)
  if (match) {
    let dt = moment()
    if (match[3] && match[4]) {
      dt = dt.add(parseInt(match[3]), match[4] === "d" ? "days" : "months")
    }
    if (ending) {
      dt.set({ hour: 23, minute: 59, second: 59 })
    } else {
      dt.set({ hour: 0, minute: 0, second: 0 })
    }
    return dt
  }
}

export const inDateRanges = (
  run: LearningResourceRun,
  availabilities: Array<string>
) => {
  if (emptyOrNil(availabilities)) {
    return true
  }
  for (const availability of availabilities) {
    if (AVAILABILITY_MAPPING[availability]) {
      const from = availabilityFilterToMoment(
        AVAILABILITY_MAPPING[availability].filter.from,
        false
      )
      const to = availabilityFilterToMoment(
        AVAILABILITY_MAPPING[availability].filter.to,
        true
      )
      const startDate = runStartDate(run)
      if (
        (!from || startDate.isSameOrAfter(from)) &&
        (!to || startDate.isSameOrBefore(to))
      ) {
        return true
      }
    }
  }
  return false
}

export const bestRunLabel = (run: ?LearningResourceRun) => {
  if (!run) {
    return AVAILABILITY_MAPPING[AVAILABLE_NOW].label
  }
  for (const range in AVAILABILITY_MAPPING) {
    if (inDateRanges(run, [range])) {
      return AVAILABILITY_MAPPING[range].label
    }
  }
}

export const runStartDate = (objectRun: LearningResourceRun): moment$Moment =>
  moment(objectRun.best_start_date || DEFAULT_START_DT, DATE_FORMAT)

export const runEndDate = (objectRun: LearningResourceRun): moment$Moment =>
  moment(objectRun.best_end_date || DEFAULT_END_DT, DATE_FORMAT)

export const compareRuns = (
  firstRun: LearningResourceRun,
  secondRun: LearningResourceRun
) => runStartDate(firstRun).diff(runStartDate(secondRun), "hours")

export const bestRun = (runs: Array<LearningResourceRun>) => {
  // Runs that are running right now
  const currentRuns = runs.filter(
    run => runStartDate(run).isSameOrBefore() && runEndDate(run).isAfter()
  )
  if (!emptyOrNil(currentRuns)) {
    return currentRuns[0]
  }

  // The next future run
  const futureRuns = runs
    .filter(run => runStartDate(run).isAfter())
    .sort(compareRuns)
  if (!emptyOrNil(futureRuns)) {
    return futureRuns[0]
  }

  // The most recent run that "ended"
  const mostRecentRuns = runs
    .filter(run => runStartDate(run).isSameOrBefore())
    .sort(compareRuns)
    .reverse()
  if (!emptyOrNil(mostRecentRuns)) {
    return mostRecentRuns[0]
  }
  return null
}

export const filterRunsByAvailability = (
  runs: ?Array<LearningResourceRun>,
  availabilities: ?Array<string>
) =>
  runs
    ? // $FlowFixMe
    runs.filter(run => inDateRanges(run, availabilities || []))
    : []

export const resourceLabel = (resource: string) => {
  if (resource === LR_TYPE_USERLIST) {
    return "Learning Lists"
  } else {
    return R.concat(capitalize(resource), "s")
  }
}

export const maxPrice = (prices: Array<CoursePrice>) => {
  if (emptyOrNil(prices)) {
    return null
  }
  const price = Math.max(...prices.map(price => price.price))
  return price > 0 ? `${formatPrice(price)}` : "Free"
}

export const minPrice = (
  prices: Array<CoursePrice>,
  includeDollarSign: boolean = false
) => {
  if (emptyOrNil(prices)) {
    return null
  }
  const price = Math.min(...prices.map(price => price.price))

  if (price > 0 && price !== Infinity) {
    return includeDollarSign ? `${formatPrice(price)}` : price
  } else {
    return "Free"
  }
}

export const getStartDate = (
  object: Object,
  objectRun: LearningResourceRun
) => {
  if (object.platform === platforms.OCW) {
    return `${capitalize(objectRun.semester || "")} ${objectRun.year || ""}`
  } else if (objectRun.start_date) {
    return moment(objectRun.start_date).format("MMMM DD, YYYY")
  } else if (objectRun.best_start_date) {
    return moment(objectRun.best_start_date).format("MMMM DD, YYYY")
  }
  return "Ongoing"
}

export const getInstructorName = (instructor: CourseInstructor) => {
  if (instructor.full_name) {
    return instructor.full_name // Assume full name contains title if any
  } else if (instructor.first_name && instructor.last_name) {
    return `Prof. ${instructor.first_name} ${instructor.last_name}`
  } else if (instructor.last_name) {
    return `Prof. ${instructor.last_name}`
  }
  return ""
}

export const privacyIcon = (privacyLevel: string) =>
  privacyLevel === "public" ? "lock_open" : "lock"

export const isCoursewareResource = R.contains(R.__, [
  LR_TYPE_COURSE,
  LR_TYPE_PROGRAM
])

export const hasCourseList = R.contains(R.__, [LR_TYPE_PROGRAM])

export const hasListItemsList = R.contains(R.__, [
  LR_TYPE_USERLIST,
  LR_TYPE_LEARNINGPATH
])

export const formatDurationClockTime = (value: string) => {
  // Format an ISO-8601 duration string so to a readable format
  // The logic here ensures that if there is a colon (:) to the left
  // of a time component (minutes, seconds) it is zero-padded
  // hours are not included if they are zero
  // this follows what most humans would consider a reasonable "clock display" format
  // Examples of output of this function:
  //
  //  3:00:01
  //  43:07
  //  3:09
  //  0:47

  const duration = moment.duration(value)
  const values = []

  if (duration.asHours() >= 1) {
    // never zero-pad this as it will always be the first component, if it present
    values.push(duration.hours().toString())
  }

  if (values.length) {
    // zero-pad the minutes if they're not the first time component
    values.push(`0${duration.minutes().toString()}`.slice(-2))
  } else {
    // otherwise it's not padded
    values.push(duration.minutes().toString())
  }

  // always zero-pad the seconds, because there's always at least a minutes component ahead of it
  values.push(`0${duration.seconds().toString()}`.slice(-2))

  return values.join(":")
}

export const isUserList = (objectType: string) =>
  R.contains(objectType, [LR_TYPE_LEARNINGPATH, LR_TYPE_USERLIST])

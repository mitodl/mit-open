import { faker } from "@faker-js/faker/locale/en"
import { mergeWith } from "lodash"
import type { Factory, PartialFactory } from "ol-util/factories"
import { makePaginatedFactory } from "ol-util/factories"
import type { PaginatedResult } from "ol-util"
import type {
  LearningResource,
  LearningResourceImage,
  LearningResourceDepartment,
  LearningResourceRun,
  LearningResourceInstructor,
  LearningResourceTopic,
  LearningPathRelationship,
  LearningPathResource,
  MicroLearningPathRelationship,
  ProgramResource,
  CourseResource,
  PodcastResource,
  PodcastEpisodeResource,
} from "api"
import { ResourceTypeEnum } from "api"
import { PartialDeep } from "type-fest"

const maybe = faker.helpers.maybe
type RepeatOptins = { min?: number; max?: number }

type LearningResourceFactory<T> = PartialFactory<Omit<T, "resource_type">, T>
/**
 * Repeat a callback a random number of times
 */
const repeat = <T>(cb: () => T, { min = 2, max = 4 }: RepeatOptins = {}) => {
  const count = faker.datatype.number({ min, max })
  return Array.from({ length: count }, cb)
}

const language = () =>
  faker.helpers.arrayElement(["en", "es", "ar", "zh", "fr", "pt"])

const mergeOverrides = <T>(
  object: Partial<T>,
  ...sources: PartialDeep<T>[]
): T =>
  mergeWith(
    object,
    ...sources,
    // arrays overwrite existing values, this way tests can force a singular value for arrays
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (objValue: any, srcValue: any) => {
      if (Array.isArray(objValue)) {
        return srcValue
      }
      return undefined
    },
  )

const learningResourceImage: Factory<LearningResourceImage> = (
  overrides = {},
) => ({
  id: faker.helpers.unique(faker.datatype.number),
  url: new URL(faker.internet.url()).toString(),
  description: faker.lorem.words(),
  alt: faker.lorem.words(),
  ...overrides,
})

const learningResourceInstructor: Factory<LearningResourceInstructor> = (
  overrides = {},
) => {
  const instructor: LearningResourceInstructor = {
    id: faker.helpers.unique(faker.datatype.number),
    first_name: maybe(faker.name.firstName),
    last_name: maybe(faker.name.lastName),
    full_name: maybe(faker.name.fullName),
    ...overrides,
  }
  return instructor
}

const learningResourceDepartment: Factory<LearningResourceDepartment> = (
  overrides = {},
) => {
  return {
    department_id: faker.helpers.unique(faker.lorem.words),
    name: faker.lorem.word(),
    ...overrides,
  }
}

const learningResourceRun: Factory<LearningResourceRun> = (overrides = {}) => {
  const start = overrides.start_date
    ? new Date(overrides.start_date)
    : faker.helpers.arrayElement([faker.date.past(), faker.date.future()])
  const end = faker.date.future(1, start)

  const run: LearningResourceRun = {
    id: faker.helpers.unique(faker.datatype.number),
    instructors: maybe(() => repeat(learningResourceInstructor)) ?? null,
    image: maybe(learningResourceImage) ?? null,
    run_id: faker.helpers.unique(faker.lorem.words),
    title: faker.lorem.words(),
    languages: maybe(() => repeat(language, { min: 0, max: 3 })),
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    ...overrides,
  }
  return run
}

const learningResourceTopic: Factory<LearningResourceTopic> = (
  overrides = {},
) => {
  const topic: LearningResourceTopic = {
    id: faker.helpers.unique(faker.datatype.number),
    name: faker.helpers.unique(faker.lorem.words),
    ...overrides,
  }
  return topic
}

const learningResourceTopics = makePaginatedFactory(learningResourceTopic)

const learningResourceType = () =>
  faker.helpers.arrayElement(Object.values(ResourceTypeEnum))

const _learningResourceShared = (): Partial<
  Omit<LearningResource, "resource_type">
> => {
  return {
    id: faker.helpers.unique(faker.datatype.number),
    professional: faker.datatype.boolean(),
    certification: null,
    departments: [learningResourceDepartment()],
    description: faker.lorem.paragraph(),
    image: learningResourceImage(),
    offered_by: null,
    platform: null,
    prices: null,
    readable_id: faker.lorem.slug(),
    resource_content_tags: repeat(faker.lorem.word),
    runs: [],
    published: faker.datatype.boolean(),
    title: faker.lorem.words(),
    topics: repeat(learningResourceTopic),
    learning_path_parents: [],
    user_list_parents: [],
  }
}

const learningResource: PartialFactory<LearningResource> = (overrides = {}) => {
  overrides = mergeOverrides(
    {
      resource_type: learningResourceType(),
    },
    overrides,
  )
  switch (overrides.resource_type) {
    case ResourceTypeEnum.Program:
      return program(overrides)
    case ResourceTypeEnum.Course:
      return course(overrides)
    case ResourceTypeEnum.LearningPath:
      return learningPath(overrides)
    case ResourceTypeEnum.Podcast:
      return podcast(overrides)
    case ResourceTypeEnum.PodcastEpisode:
      return podcastEpisode(overrides)
    default:
      throw Error(`Invalid resource type: ${overrides.resource_type}`)
  }
}

const program: PartialFactory<ProgramResource> = (overrides = {}) => {
  return mergeOverrides<ProgramResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.Program },
    {
      platform: faker.lorem.word(),
      certification: faker.lorem.word(),
      offered_by: faker.lorem.word(),
      program: {
        courses: repeat(course, { min: 0, max: 5 }),
      },
    },
    overrides,
  )
}
const programs = makePaginatedFactory(program)

const course: LearningResourceFactory<CourseResource> = (overrides = {}) => {
  return mergeOverrides<CourseResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.Course },
    {
      platform: faker.lorem.word(),
      runs: repeat(learningResourceRun, { min: 1, max: 5 }),
      certification: faker.lorem.word(),
      offered_by: faker.lorem.word(),
      course: {
        course_numbers: maybe(() => repeat(faker.lorem.word)) ?? null,
      },
    },
    overrides,
  )
}
const courses = makePaginatedFactory(course)

const learningResources = makePaginatedFactory(learningResource)

const learningPath: LearningResourceFactory<LearningPathResource> = (
  overrides = {},
) => {
  return mergeOverrides<LearningPathResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.LearningPath },
    {
      learning_path: {
        id: faker.helpers.unique(faker.datatype.number),
        item_count: faker.datatype.number({ min: 1, max: 30 }),
        author: faker.datatype.number(),
      },
      learning_path_parents: [],
    },
    overrides,
  )
}
const learningPaths = makePaginatedFactory(learningPath)

const microRelationship: Factory<MicroLearningPathRelationship> = (
  overrides = {},
) => {
  return {
    id: faker.helpers.unique(faker.datatype.number),
    child: faker.helpers.unique(faker.datatype.number),
    parent: faker.helpers.unique(faker.datatype.number),
    ...overrides,
  }
}

const learningPathRelationship: Factory<LearningPathRelationship> = (
  overrides = {},
) => {
  const micro = microRelationship()
  const resource = learningResource({
    id: micro.child,
    learning_path_parents: [micro],
  })
  return {
    ...micro,
    position: faker.datatype.number(),
    resource,
    ...overrides,
  }
}
const learningPathRelationships = ({
  count,
  parent,
  pageSize,
  next = null,
  previous = null,
}: {
  count: number
  parent: number
  pageSize?: number
  next?: string | null
  previous?: string | null
}): PaginatedResult<LearningPathRelationship> => {
  const results: LearningPathRelationship[] = Array(pageSize ?? count)
    .fill(null)
    .map((_val, index) => {
      return learningPathRelationship({
        position: index + 1,
        parent,
      })
    })
  return {
    count,
    next,
    previous,
    results,
  }
}

const podcast: LearningResourceFactory<PodcastResource> = (overrides = {}) => {
  return mergeOverrides<PodcastResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.Podcast },
    {
      podcast: {
        id: faker.helpers.unique(faker.datatype.number),
        episode_count: faker.datatype.number({ min: 1, max: 70 }),
      },
    },
    overrides,
  )
}
const podcasts = makePaginatedFactory(podcast)

const podcastEpisode: LearningResourceFactory<PodcastEpisodeResource> = (
  overrides = {},
): PodcastEpisodeResource => {
  return mergeOverrides<PodcastEpisodeResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.PodcastEpisode },
    {
      podcast_episode: {
        id: faker.helpers.unique(faker.datatype.number),
      },
    },
    overrides,
  )
}

const podcastEpisodes = makePaginatedFactory(podcastEpisode)

export {
  learningResource as resource,
  learningResources as resources,
  learningResourceRun as run,
  learningResourceImage as image,
  learningResourceDepartment as department,
  learningResourceTopics as topics,
  learningPath,
  learningPaths,
  microRelationship,
  learningPathRelationship,
  learningPathRelationships,
  program,
  programs,
  course,
  courses,
  podcast,
  podcasts,
  podcastEpisode,
  podcastEpisodes,
}

import { faker } from "@faker-js/faker/locale/en"
import { startCase } from "lodash"
import type { Factory, PartialFactory } from "ol-test-utilities"
import { makePaginatedFactory } from "ol-test-utilities"
import type {
  CourseNumber,
  LearningResource,
  LearningResourceImage,
  LearningResourceDepartment,
  LearningResourceOfferor,
  LearningResourcePlatform,
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
  PaginatedLearningPathRelationshipList,
  VideoResource,
  VideoPlaylistResource,
  LearningResourceBaseSchool,
  LearningResourceBaseDepartment,
  LearningResourceSchool,
} from "api"
import { ResourceTypeEnum, LearningResourceRunLevelInnerCodeEnum } from "api"
import { mergeOverrides } from "./index"

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

const learningResourceBaseSchool: Factory<LearningResourceBaseSchool> = (
  overrides = {},
) => {
  return {
    id: faker.helpers.unique(faker.datatype.number),
    name: faker.lorem.word(),
    url: faker.internet.url(),
    ...overrides,
  }
}

const learningResourceBaseDepartment: Factory<
  LearningResourceBaseDepartment
> = (overrides = {}) => {
  return {
    department_id: faker.helpers.unique(faker.lorem.words),
    name: faker.helpers.unique(faker.lorem.words),
    channel_url: faker.internet.url(),
    ...overrides,
  }
}

const learningResourceDepartment: Factory<LearningResourceDepartment> = (
  overrides = {},
) => {
  return {
    ...learningResourceBaseDepartment(),
    school: maybe(learningResourceBaseSchool) ?? null,
    ...overrides,
  }
}
const departments = makePaginatedFactory(learningResourceDepartment)

const learnigResourceSchool: Factory<LearningResourceSchool> = (
  overrides = {},
) => {
  return {
    id: faker.helpers.unique(faker.datatype.number),
    name: faker.lorem.word(),
    url: faker.internet.url(),
    departments: repeat(learningResourceBaseDepartment),
    ...overrides,
  }
}
const schools = makePaginatedFactory(learnigResourceSchool)

const learningResourcePlatform: Factory<LearningResourcePlatform> = (
  overrides = {},
) => {
  return {
    code: faker.helpers.unique(faker.lorem.words),
    name: faker.helpers.unique(faker.lorem.words),
    ...overrides,
  }
}

const learningResourceOfferor: Factory<LearningResourceOfferor> = (
  overrides = {},
) => {
  return {
    code: faker.helpers.unique(faker.lorem.words),
    name: faker.helpers.unique(faker.lorem.words),
    channel_url: faker.internet.url(),
    ...overrides,
  }
}
const learningResourceOfferors = makePaginatedFactory(learningResourceOfferor)
const learningResourcePlatforms = makePaginatedFactory(learningResourcePlatform)

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
    level: [
      {
        code: faker.helpers.arrayElement(
          Object.values(LearningResourceRunLevelInnerCodeEnum),
        ),
        name: faker.helpers.unique(faker.lorem.words),
      },
    ],
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
    channel_url: faker.internet.url(),
    parent: null,
    ...overrides,
  }
  return topic
}

const learningResourceTopics = makePaginatedFactory(learningResourceTopic)

const learningResourceType = () =>
  faker.helpers.arrayElement(Object.values(ResourceTypeEnum))

const learningResourceCourseNumber: Factory<CourseNumber> = (
  overrides = {},
) => {
  return {
    department: learningResourceDepartment(),
    value: faker.lorem.word(),
    listing_type: "primary",
    primary: faker.datatype.boolean(),
    sort_coursenum: faker.lorem.word(),
    ...overrides,
  }
}

const _learningResourceShared = (): Partial<
  Omit<LearningResource, "resource_type">
> => {
  return {
    id: faker.helpers.unique(faker.datatype.number),
    professional: faker.datatype.boolean(),
    certification: false,
    departments: [learningResourceDepartment()],
    description: faker.lorem.paragraph(),
    image: learningResourceImage(),
    offered_by: maybe(learningResourceOfferor) ?? null,
    platform: maybe(learningResourcePlatform) ?? null,
    prices: "",
    readable_id: faker.lorem.slug(),
    course_feature: repeat(faker.lorem.word),
    runs: [],
    published: faker.datatype.boolean(),
    title: startCase(faker.lorem.words()),
    topics: repeat(learningResourceTopic),
    learning_path_parents: [],
    user_list_parents: [],
    url: faker.internet.url(),
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
    case ResourceTypeEnum.VideoPlaylist:
      return videoPlaylist(overrides)
    case ResourceTypeEnum.Video:
      return video(overrides)
    default:
      throw Error(`Invalid resource type: ${overrides.resource_type}`)
  }
}

const learningResources = makePaginatedFactory(learningResource)

const program: PartialFactory<ProgramResource> = (overrides = {}) => {
  return mergeOverrides<ProgramResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.Program },
    {
      offered_by: learningResourceOfferor(),
      platform: learningResourcePlatform(),
      certification: faker.datatype.boolean(),
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
      offered_by: learningResourceOfferor(),
      platform: learningResourcePlatform(),
      runs: repeat(learningResourceRun, { min: 1, max: 5 }),
      certification: faker.datatype.boolean(),
      course: {
        course_numbers:
          maybe(() => repeat(learningResourceCourseNumber)) ?? null,
      },
    },
    overrides,
  )
}
const courses = makePaginatedFactory(course)

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
      },
      learning_path_parents: [],
    },
    overrides,
  )
}
const learningPaths = makePaginatedFactory(learningPath)

const microLearningPathRelationship: Factory<MicroLearningPathRelationship> = (
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
  const micro = microLearningPathRelationship()
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
}) => {
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
  } satisfies PaginatedLearningPathRelationshipList
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

const video: LearningResourceFactory<VideoResource> = (overrides = {}) => {
  return mergeOverrides<VideoResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.Video },
    {
      video: {
        duration: faker.datatype.number({ min: 1, max: 70 }).toString(),
        transcript: faker.lorem.paragraph(),
      },
    },
    overrides,
  )
}
const videos = makePaginatedFactory(video)

const videoPlaylist: LearningResourceFactory<VideoPlaylistResource> = (
  overrides = {},
): VideoPlaylistResource => {
  return mergeOverrides<VideoPlaylistResource>(
    _learningResourceShared(),
    { resource_type: ResourceTypeEnum.VideoPlaylist },
    {
      video_playlist: {
        video_count: faker.datatype.number({ min: 1, max: 100 }),
        channel: {
          channel_id: faker.helpers.unique(faker.datatype.number).toString(),
          title: faker.lorem.words(),
        },
      },
    },
    overrides,
  )
}

const videoPlaylists = makePaginatedFactory(videoPlaylist)

export {
  learningResource as resource,
  learningResources as resources,
  learningResourceRun as run,
  learningResourceImage as image,
  learningResourceDepartment as department,
  departments,
  learningResourceTopics as topics,
  learningResourceOfferors as offerors,
  learningResourcePlatforms as platforms,
  learningPath,
  learningPaths,
  microLearningPathRelationship,
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
  video,
  videos,
  videoPlaylist,
  videoPlaylists,
  learnigResourceSchool as school,
  schools,
}

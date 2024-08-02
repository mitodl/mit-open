import { ResourceTypeEnum } from "api"
import { factories } from "api/test-utils"

const _makeResource = factories.learningResources.resource

const makeResource: typeof _makeResource = (overrides) => {
  const resource = _makeResource(overrides)
  if (resource.image) {
    resource.image.url =
      "https://ocw.mit.edu/courses/res-hso-001-mit-haystack-observatory-k12-stem-lesson-plans/mitres_hso_001.jpg"
  }
  if (resource.resource_type === ResourceTypeEnum.Video) {
    resource.url = "https://www.youtube.com/watch?v=4A9bGL-_ilA"
  }
  return resource
}

const resources = {
  withoutImage: makeResource({ image: null }),
  course: makeResource({
    resource_type: ResourceTypeEnum.Course,
  }),
  program: makeResource({
    resource_type: ResourceTypeEnum.Program,
  }),
  video: makeResource({
    resource_type: ResourceTypeEnum.Video,
    url: "https://www.youtube.com/watch?v=-E9hf5RShzQ",
  }),
  videoPlaylist: makeResource({
    resource_type: ResourceTypeEnum.VideoPlaylist,
  }),
  podcast: makeResource({
    resource_type: ResourceTypeEnum.Podcast,
  }),
  podcastEpisode: makeResource({
    resource_type: ResourceTypeEnum.PodcastEpisode,
  }),
  learningPath: makeResource({
    resource_type: ResourceTypeEnum.LearningPath,
  }),
}

const courses = {
  free: {
    noCertificate: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: true,
      certification: false,
      prices: ["0"],
    }),
    withCertificateOnePrice: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: true,
      certification: true,
      prices: ["0", "49"],
    }),
    withCertificatePriceRange: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: true,
      certification: true,
      prices: ["0", "99", "49"],
    }),
  },
  unknownPrice: {
    noCertificate: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: false,
      prices: [],
    }),
    withCertificate: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: true,
      prices: [],
    }),
  },
  paid: {
    withoutCertificate: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: false,
      prices: ["49"],
    }),
    withCerticateOnePrice: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: true,
      prices: ["49"],
    }),
    withCertificatePriceRange: makeResource({
      resource_type: ResourceTypeEnum.Course,
      runs: [factories.learningResources.run()],
      free: false,
      certification: true,
      prices: ["49", "99"],
    }),
  },
  start: {
    anytime: makeResource({
      resource_type: ResourceTypeEnum.Course,
      availability: "anytime",
    }),
    dated: makeResource({
      resource_type: ResourceTypeEnum.Course,
      availability: "dated",
    }),
  },
}

const resourceArgType = {
  options: ["Loading", "Without Image", ...Object.values(ResourceTypeEnum)],
  mapping: {
    Loading: null,
    "Without Image": resources.withoutImage,
    [ResourceTypeEnum.Course]: resources.course,
    [ResourceTypeEnum.Program]: resources.program,
    [ResourceTypeEnum.Video]: resources.video,
    [ResourceTypeEnum.VideoPlaylist]: resources.videoPlaylist,
    [ResourceTypeEnum.Podcast]: resources.podcast,
    [ResourceTypeEnum.PodcastEpisode]: resources.podcastEpisode,
    [ResourceTypeEnum.LearningPath]: resources.learningPath,
  },
}

export { resourceArgType, resources, courses }

import { faker } from "@faker-js/faker/locale/en"
import { makePaginatedFactory, type PartialFactory } from "ol-test-utilities"
import {
  ChannelTypeEnum,
  DepartmentChannel,
  FieldChannel,
  OfferorChannel,
  PathwayChannel,
  TopicChannel,
} from "../../generated/v0"
import { offeror } from "./learningResources"
import { mergeOverrides } from "./"
const channelType = () =>
  faker.helpers.arrayElement(Object.values(ChannelTypeEnum))

const field: PartialFactory<FieldChannel> = (overrides = {}) => {
  overrides = mergeOverrides(
    {
      channel_type: channelType(),
    },
    overrides,
  )
  switch (overrides.channel_type) {
    case ChannelTypeEnum.Department:
      return departmentChannel(overrides)
    case ChannelTypeEnum.Topic:
      return topicChannel(overrides)
    case ChannelTypeEnum.Offeror:
      return offerorChannel(overrides)
    case ChannelTypeEnum.Pathway:
      return pathwayChannel(overrides)
    default:
      throw Error(`Invalid resource type: ${overrides.channel_type}`)
  }
}

const departmentChannel: PartialFactory<DepartmentChannel> = (
  overrides = {},
) => {
  return mergeOverrides<DepartmentChannel>(
    _fieldShared(),
    { channel_type: ChannelTypeEnum.Department },
    {
      department_detail: {
        department: faker.lorem.slug(),
      },
    },
    overrides,
  )
}

const topicChannel: PartialFactory<TopicChannel> = (overrides = {}) => {
  return mergeOverrides<TopicChannel>(
    _fieldShared(),
    { channel_type: ChannelTypeEnum.Topic },
    {
      topic_detail: {
        topic: faker.datatype.number(),
      },
    },
    overrides,
  )
}

const offerorChannel: PartialFactory<OfferorChannel> = (overrides = {}) => {
  return mergeOverrides<OfferorChannel>(
    _fieldShared(),
    { channel_type: ChannelTypeEnum.Offeror },
    {
      offeror_detail: {
        offeror: offeror(),
      },
    },
    overrides,
  )
}

const pathwayChannel: PartialFactory<PathwayChannel> = (overrides = {}) => {
  return mergeOverrides<PathwayChannel>(
    _fieldShared(),
    { channel_type: ChannelTypeEnum.Pathway },
    overrides,
  )
}

const _fieldShared = (): Partial<Omit<FieldChannel, "channel_type">> => {
  return {
    name: faker.helpers.unique(faker.lorem.slug),
    about: faker.lorem.paragraph(),
    title: faker.lorem.words(faker.datatype.number({ min: 1, max: 4 })),
    public_description: faker.lorem.paragraph(),
    banner: new URL(faker.internet.url()).toString(),
    avatar_small: new URL(faker.internet.url()).toString(),
    avatar_medium: new URL(faker.internet.url()).toString(),
    avatar: new URL(faker.internet.url()).toString(),
    is_moderator: faker.datatype.boolean(),
    widget_list: faker.datatype.number(),
    subfields: [],
    featured_list: null,
    lists: [],
    updated_on: faker.date.recent().toString(),
    created_on: faker.date.recent().toString(),
    id: faker.datatype.number(),
    ga_tracking_id: faker.lorem.slug(),
    configuration: faker.datatype.json(),
    search_filter: faker.helpers.mustache("{key}={value}", {
      key: faker.lorem.slug(),
      value: faker.lorem.slug(),
    }),
  }
}

const fields = makePaginatedFactory(field)

export { fields, field }

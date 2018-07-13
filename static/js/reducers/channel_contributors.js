// @flow
import { GET, POST, DELETE, INITIAL_STATE } from "redux-hammock/constants"

import * as api from "../lib/api"

import type { ChannelContributors, Contributor } from "../flow/discussionTypes"

type ChannelContributorsEndpointResponse = {
  channelName: string,
  response: ChannelContributors
}

type AddChannelContributor = {
  channelName: string,
  contributor: Contributor
}

type DeleteChannelContributor = {
  channelName: string,
  username: string
}

const addContributor = (
  { channelName, contributor }: AddChannelContributor,
  data: Map<string, ChannelContributors>
): Map<string, ChannelContributors> => {
  const update = new Map(data)
  const contributors = update.get(channelName) || []
  update.set(channelName, contributors.concat([contributor]))
  return update
}

const deleteContributor = (
  { channelName, username }: DeleteChannelContributor,
  data: Map<string, ChannelContributors>
): Map<string, ChannelContributors> => {
  const update = new Map(data)
  const contributors = update.get(channelName) || []
  update.set(
    channelName,
    contributors.filter(
      contributor => contributor.contributor_name !== username
    )
  )
  return update
}

export const channelContributorsEndpoint = {
  name:         "channelContributors",
  verbs:        [GET, POST, DELETE],
  initialState: { ...INITIAL_STATE, data: new Map() },
  getFunc:      async (channelName: string) => {
    const response = await api.getChannelContributors(channelName)
    return { channelName, response }
  },
  getSuccessHandler: (
    { channelName, response }: ChannelContributorsEndpointResponse,
    data: Map<string, ChannelContributors>
  ): Map<string, ChannelContributors> => {
    const update = new Map(data)
    update.set(channelName, response)
    return update
  },
  postFunc: async (channelName: string, username: string) => {
    const contributor = await api.addChannelContributor(channelName, username)
    return { channelName, contributor }
  },
  postSuccessHandler: addContributor,
  deleteFunc:         async (channelName: string, username: string) => {
    await api.deleteChannelContributor(channelName, username)
    return { channelName, username }
  },
  deleteSuccessHandler: deleteContributor
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { profilesApi } from "../../clients"
import type { Profile, PatchedProfileRequest } from "../../generated/v0/api"

const useProfileQuery = (username: string) =>
  useQuery<Profile>({
    queryKey: ["profiles", { username }],
    queryFn: async (): Promise<Profile> => {
      const response = await profilesApi.profilesRetrieve({
        user__username: username,
      })
      return response.data
    },
  })

const useProfileMutation = (username: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: PatchedProfileRequest) => {
      return profilesApi.profilesPartialUpdate({
        user__username: username,
        PatchedProfileRequest: params,
      })
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["profiles", { username }], response.data)
    },
  })
}

const useProfileMeQuery = () => useProfileQuery("me")

const useProfileMeMutation = () => useProfileMutation("me")

export {
  useProfileQuery,
  useProfileMutation,
  useProfileMeQuery,
  useProfileMeMutation,
}
export type { Profile }

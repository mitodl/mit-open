import { useQuery } from "@tanstack/react-query"
import { learningResourcesSearchAdminParamsApi } from "../../clients"

const useAdminSearchParams = (enabled: boolean) =>
  useQuery({
    queryKey: ["adminParams"],
    queryFn: async () => {
      const response =
        await learningResourcesSearchAdminParamsApi.learningResourcesSearchAdminParamsRetrieve()
      return response.data
    },
    enabled: enabled,
  })

export { useAdminSearchParams }

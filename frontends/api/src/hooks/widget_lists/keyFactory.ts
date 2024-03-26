import { widgetListsApi } from "../../clients"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const widgetLists = createQueryKeys("widgetLists", {
  detail: (id: number) => ({
    queryKey: [id],
    queryFn: () => {
      if (id < 0) return Promise.reject("Invalid ID")
      return widgetListsApi.widgetListsRetrieve({ id }).then((res) => res.data)
    },
  }),
})

export default widgetLists

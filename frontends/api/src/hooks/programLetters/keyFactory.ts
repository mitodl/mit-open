import { programLettersApi } from "../../clients"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const programLetters = createQueryKeys("programLetters", {
  detail: (id: string) => ({
    queryKey: [id],
    queryFn: () => {
      if (id === "") return Promise.reject("Invalid ID")
      return programLettersApi
        .programLettersRetrieve({ id })
        .then((res) => res.data)
    },
  }),
})

export default programLetters

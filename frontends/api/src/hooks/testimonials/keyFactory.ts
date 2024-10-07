import { testimonialsApi } from "../../clients"
import type { TestimonialsApiTestimonialsListRequest as TestimonialsListRequest } from "@mitodl/open-api-axios/v0"
import { createQueryKeys } from "@lukemorales/query-key-factory"

const testimonials = createQueryKeys("testimonials", {
  detail: (id: number) => ({
    queryKey: [id],
    queryFn: () => {
      if (id < 0) return Promise.reject("Invalid ID")
      return testimonialsApi
        .testimonialsRetrieve({ id })
        .then((res) => res.data)
    },
  }),
  list: (params: TestimonialsListRequest) => ({
    queryKey: [params],
    queryFn: () =>
      testimonialsApi.testimonialsList(params).then((res) => res.data),
  }),
})

export default testimonials

import { testimonialsApi, featuredTestimonialsApi } from "../../clients"
import type {
  TestimonialsApiTestimonialsListRequest as TestimonialsListRequest,
  FeaturedTestimonialsApiFeaturedTestimonialsListRequest as FeaturedTestimonialsListRequest,
} from "../../generated/v0"
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

const featuredTestimonials = createQueryKeys("featuredTestimonials", {
  detail: (id: number) => ({
    queryKey: [id],
    queryFn: () => {
      if (id < 0) return Promise.reject("Invalid ID")
      return featuredTestimonialsApi
        .featuredTestimonialsRetrieve({ id })
        .then((res) => res.data)
    },
  }),
  list: (params: FeaturedTestimonialsListRequest) => ({
    queryKey: [params],
    queryFn: () =>
      featuredTestimonialsApi
        .featuredTestimonialsList(params)
        .then((res) => res.data),
  }),
})

export default testimonials
export { featuredTestimonials }

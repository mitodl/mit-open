import { UseQueryOptions, useQuery } from "@tanstack/react-query"

import type {
  TestimonialsApiTestimonialsListRequest,
  FeaturedTestimonialsApiFeaturedTestimonialsListRequest,
} from "../../generated/v0"
import testimonials, { featuredTestimonials } from "./keyFactory"

const useTestimonialList = (
  params: TestimonialsApiTestimonialsListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...testimonials.list(params),
    ...opts,
  })
}

/**
 * Query is diabled if id is undefined.
 */
const useTestimonialDetail = (id: number | undefined) => {
  return useQuery({
    ...testimonials.detail(id ?? -1),
    enabled: id !== undefined,
  })
}

const useFeaturedTestimonialList = (
  params: FeaturedTestimonialsApiFeaturedTestimonialsListRequest = {},
  opts: Pick<UseQueryOptions, "enabled"> = {},
) => {
  return useQuery({
    ...featuredTestimonials.list(params),
    ...opts,
  })
}

export { useTestimonialDetail, useTestimonialList, useFeaturedTestimonialList }

import { UseQueryOptions, useQuery } from "@tanstack/react-query"

import type { TestimonialsApiTestimonialsListRequest } from "../../generated/v0"
import testimonials from "./keyFactory"

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

export { useTestimonialDetail, useTestimonialList }

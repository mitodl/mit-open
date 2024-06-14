import type { PartialDeep } from "type-fest"
import { mergeWith } from "lodash"

const mergeOverrides = <T>(
  object: Partial<T>,
  ...sources: PartialDeep<T>[]
): T =>
  mergeWith(
    object,
    ...sources,
    // arrays overwrite existing values, this way tests can force a singular value for arrays
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (objValue: any, srcValue: any) => {
      if (Array.isArray(objValue)) {
        return srcValue
      }
      return undefined
    },
  )

export { mergeOverrides }

export * as articles from "./articles"
export * as fields from "./fields"
export * as learningResources from "./learningResources"
export * as newsEvents from "./newsEvents"
export * as percolateQueries from "./percolateQueries"
export * as letters from "./programLetters"
export * as userLists from "./userLists"
export * as user from "./user"
export * as testimonials from "./testimonials"

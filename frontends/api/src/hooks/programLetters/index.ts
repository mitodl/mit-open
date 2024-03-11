import { useQuery } from "@tanstack/react-query"
import programLetters from "./keyFactory"

/**
 * Query is diabled if id is undefined.
 */
const useProgramLettersDetail = (id: string | undefined) => {
  return useQuery({
    ...programLetters.detail(id ?? ""),
    enabled: id !== undefined,
  })
}

export { useProgramLettersDetail }

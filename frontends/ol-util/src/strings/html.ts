import striptags from "striptags"
import { decode } from "html-entities"

export const decodeAndStripTags = (html: string) => {
  return decode(striptags(html))
}

import React, { useMemo, useEffect } from "react"
import classNames from "classnames"
import "../../assets/vendor/ckeditor_content_styles.scss"
import { embedlyCardHtml, ensureEmbedlyPlatform } from "ol-utilities"

const parser = new DOMParser()
interface Replacer {
  selector: string
  replacer: (match: Element) => Node | null
}
/**
 * Make replacementments in and HTML string.
 */
const htmlFindAndReplace = (html: string, replacers: Replacer[]): string => {
  const dom = parser.parseFromString(html, "text/html")
  replacers.forEach(({ selector, replacer }) =>
    dom.querySelectorAll(selector).forEach((match) => {
      const replacement = replacer(match)
      const parent = match.parentNode
      if (parent && replacement) {
        parent.replaceChild(replacement, match)
      }
    }),
  )
  return dom.body.innerHTML
}

/**
 * Display content created with Ckeditor.
 *
 * NOTE: This is not an editor!
 *
 * This component:
 *  - applies a stylesheet expected by Ckeditor-created content. (E.g., image
 * alignment)
 *  - Replaces <oembed> tags with embedly cards.
 */
const CkeditorDisplay: React.FC<{
  dangerouslySetInnerHTML: string
  className?: string
}> = ({ dangerouslySetInnerHTML, className }) => {
  useEffect(() => {
    ensureEmbedlyPlatform()
  }, [])

  /**
   * A reasonable alternative to this might be
   * https://www.npmjs.com/package/html-react-parser
   * particularly if we want to replace html with react components.
   * Currently, we are replacing html with html.
   */
  const html = useMemo(
    () =>
      htmlFindAndReplace(dangerouslySetInnerHTML, [
        {
          selector: "figure.media",
          replacer: (match) => {
            const url = match
              .querySelector("oembed")
              ?.attributes.getNamedItem("url")?.value
            if (!url) return null
            const template = document.createElement("template")
            template.innerHTML = embedlyCardHtml(url)
            return template.content.firstChild
          },
        },
      ]),
    [dangerouslySetInnerHTML],
  )
  return (
    <div
      className={classNames("ck-content", className)}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  )
}

export default CkeditorDisplay

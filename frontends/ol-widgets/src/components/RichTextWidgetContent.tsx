import classNames from "classnames"
import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { RichTextWidgetInstance } from "../interfaces"

const REMARK_PLUGINS = [remarkGfm]

const RichTextWidgetContent: React.FC<{
  className?: string
  widget: Omit<RichTextWidgetInstance, "id">
}> = ({ widget, className }) => {
  return (
    <ReactMarkdown
      className={classNames("ol-markdown", className)}
      // @ts-expect-error Seeing this https://github.com/remarkjs/react-markdown/issues/627 despite fixing react-markdown and remark-gfm versions
      remarkPlugins={REMARK_PLUGINS}
    >
      {widget.configuration.source}
    </ReactMarkdown>
  )
}

export default RichTextWidgetContent

import React from "react"
import { RoutedDrawer, ExpandedLearningResourceDisplay } from "ol-components"
import type { RoutedDrawerProps } from "ol-components"
import { useLearningResourcesDetail } from "api/hooks/learningResources"
import { imgConfigs } from "@/common/constants"
import { useSearchParams } from "react-router-dom"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import PostHogView from "@/components/PostHogView/PostHogView"

const RESOURCE_DRAWER_PARAMS = [RESOURCE_DRAWER_QUERY_PARAM] as const

const DrawerContent: React.FC<{
  resourceId: number
}> = ({ resourceId }) => {
  const resource = useLearningResourcesDetail(Number(resourceId))
  return (
    <ExpandedLearningResourceDisplay
      imgConfig={imgConfigs.large}
      resource={resource.data}
    />
  )
}

const PAPER_PROPS: RoutedDrawerProps["PaperProps"] = {
  sx: {
    padding: "1rem",
    maxWidth: (theme) => `${theme.breakpoints.values.sm}px`,
  },
}

const LearningResourceDrawer = () => {
  return (
    <PostHogView
      anchor="right"
      requiredParams={RESOURCE_DRAWER_PARAMS}
      PaperProps={PAPER_PROPS}
    >
      {({ params }) => <DrawerContent resourceId={Number(params.resource)} />}
    </PostHogView>
  )
}

const useOpenLearningResourceDrawer = () => {
  const [_searchParams, setSearchParams] = useSearchParams()
  const openLearningResourceDrawer = React.useCallback(
    (resourceId: number) => {
      setSearchParams((current) => {
        const copy = new URLSearchParams(current)
        copy.set(RESOURCE_DRAWER_QUERY_PARAM, resourceId.toString())
        return copy
      })
    },
    [setSearchParams],
  )
  return openLearningResourceDrawer
}

export default LearningResourceDrawer
export { useOpenLearningResourceDrawer }

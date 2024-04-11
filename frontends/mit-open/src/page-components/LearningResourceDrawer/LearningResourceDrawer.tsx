import React from "react"
import { RoutedDrawer, ExpandedLearningResourceDisplay } from "ol-components"
import type { RoutedDrawerProps } from "ol-components"
import { useLearningResourcesDetail } from "api/hooks/learningResources"
import { imgConfigs } from "@/common/constants"
import { useSearchParams } from "react-router-dom"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import { usePostHog } from "posthog-js/react"

const RESOURCE_DRAWER_PARAMS = [RESOURCE_DRAWER_QUERY_PARAM] as const

const useCapturePageView = (resourceId: number, isOpen: boolean) => {
  const resource = useLearningResourcesDetail(Number(resourceId))
  const posthog = usePostHog()

  if (APP_SETTINGS.posthog?.enabled && resource.isSuccess && isOpen) {
    posthog.capture("lrd_view", {
      resourceId: resource.data.id || "unknown",
      readableId: resource.data.readable_id,
      platformCode: resource.data.platform?.code,
      resourceType: resource.data.resource_type,
    })
  }
}

const DrawerContent: React.FC<{
  resourceId: number
  isOpen: boolean
}> = ({ resourceId, isOpen }) => {
  const resource = useLearningResourcesDetail(Number(resourceId))
  useCapturePageView(Number(resourceId), isOpen)

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
    <RoutedDrawer
      anchor="right"
      requiredParams={RESOURCE_DRAWER_PARAMS}
      PaperProps={PAPER_PROPS}
    >
      {({ params, open }) => {
        return (
          <>
            <DrawerContent resourceId={Number(params.resource)} isOpen={open} />
          </>
        )
      }}
    </RoutedDrawer>
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

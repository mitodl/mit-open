import React, { useEffect } from "react"
import { RoutedDrawer, ExpandedLearningResourceDisplay } from "ol-components"
import type { RoutedDrawerProps } from "ol-components"
import { useLearningResourcesDetail } from "api/hooks/learningResources"
import { imgConfigs } from "@/common/constants"
import { useSearchParams } from "react-router-dom"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import { usePostHog } from "posthog-js/react"

const RESOURCE_DRAWER_PARAMS = [RESOURCE_DRAWER_QUERY_PARAM] as const

const useCapturePageView = (resourceId: number) => {
  const { data, isSuccess } = useLearningResourcesDetail(Number(resourceId))
  const posthog = usePostHog()

  useEffect(() => {
    if (
      APP_SETTINGS.posthog?.api_key &&
      APP_SETTINGS.posthog.api_key.length > 0
    )
      return
    if (!isSuccess) return
    posthog.capture("lrd_view", {
      resourceId: data?.id,
      readableId: data?.readable_id,
      platformCode: data?.platform?.code,
      resourceType: data?.resource_type,
    })
  }, [
    isSuccess,
    posthog,
    data?.id,
    data?.readable_id,
    data?.platform?.code,
    data?.resource_type,
  ])
}

const DrawerContent: React.FC<{
  resourceId: number
}> = ({ resourceId }) => {
  const resource = useLearningResourcesDetail(Number(resourceId))
  useCapturePageView(Number(resourceId))

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
      {({ params }) => {
        return <DrawerContent resourceId={Number(params.resource)} />
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


import React, { useCallback } from "react"
import {
  RoutedDrawer,
  LearningResourceExpanded,
  imgConfigs,
} from "ol-components"
import type { RoutedDrawerProps } from "ol-components"
import { useLearningResourcesDetail } from "api/hooks/learningResources"
import { useSearchParams, useRouter, ReadonlyURLSearchParams } from "next/navigation"

import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
// import { usePostHog } from "posthog-js/react"

const RESOURCE_DRAWER_PARAMS = [RESOURCE_DRAWER_QUERY_PARAM] as const

/*
const useCapturePageView = (resourceId: number) => {
  const { data, isSuccess } = useLearningResourcesDetail(Number(resourceId))
  const posthog = usePostHog()

  // TODO Provide POSTHOG env vars

  // const { POSTHOG } = APP_SETTINGS

  // useEffect(() => {
  //   if (!POSTHOG?.api_key || POSTHOG.api_key.length < 1) return
  //   if (!isSuccess) return
  //   posthog.capture("lrd_view", {
  //     resourceId: data?.id,
  //     readableId: data?.readable_id,
  //     platformCode: data?.platform?.code,
  //     resourceType: data?.resource_type,
  //   })
  // }, [
  //   isSuccess,
  //   posthog,
  //   data?.id,
  //   data?.readable_id,
  //   data?.platform?.code,
  //   data?.resource_type,
  //   POSTHOG?.api_key,
  // ])
}
*/
const DrawerContent: React.FC<{
  resourceId: number
}> = ({ resourceId }) => {
  const resource = useLearningResourcesDetail(Number(resourceId))
  // useCapturePageView(Number(resourceId))

  return (
    <LearningResourceExpanded
      imgConfig={imgConfigs.large}
      resource={resource.data}
    />
  )
}

const PAPER_PROPS: RoutedDrawerProps["PaperProps"] = {
  sx: {
    maxWidth: (theme) => theme.breakpoints.values.sm,
    minWidth: (theme) => ({
      [theme.breakpoints.down("sm")]: {
        minWidth: "100%",
      },
    }),
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

const getOpenDrawerSearchParams = (current: ReadonlyURLSearchParams, resourceId: number) => {
  const newSearchParams = new URLSearchParams(current)
  newSearchParams.set(RESOURCE_DRAWER_QUERY_PARAM, resourceId.toString())
  return newSearchParams
}

const useOpenLearningResourceDrawer = () => {
  const searchParams = useSearchParams()
  const router = useRouter();

  const openLearningResourceDrawer = useCallback(
    (resourceId: number) => {
      router.push(`?${getOpenDrawerSearchParams(searchParams, resourceId)}`)
    },
    [router, searchParams],
  )
  return openLearningResourceDrawer
}


const useResourceDrawerHref = () => {
  const searchParams = useSearchParams()

  return useCallback(
    (resourceId: number) => {
      return `?${getOpenDrawerSearchParams(searchParams, resourceId)}`
    },
    [searchParams],
  )
}

export default LearningResourceDrawer
export { useOpenLearningResourceDrawer, useResourceDrawerHref }

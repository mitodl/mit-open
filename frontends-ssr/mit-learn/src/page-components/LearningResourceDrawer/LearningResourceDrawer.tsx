import React, { useEffect, useCallback } from "react"
import {
  RoutedDrawer,
  LearningResourceExpanded,
  imgConfigs,
} from "ol-components"
import type { RoutedDrawerProps } from "ol-components"
import { useLearningResourcesDetail } from "api/hooks/learningResources"
import { useSearchParams, useRouter, useParams  } from 'next/navigation'

import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import { usePostHog } from "posthog-js/react"

const RESOURCE_DRAWER_PARAMS = [RESOURCE_DRAWER_QUERY_PARAM] as const

const useCapturePageView = (resourceId: number) => {
  const { data, isSuccess } = useLearningResourcesDetail(Number(resourceId))
  const posthog = usePostHog()

  const { POSTHOG } = APP_SETTINGS

  useEffect(() => {
    if (!POSTHOG?.api_key || POSTHOG.api_key.length < 1) return
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
    POSTHOG?.api_key,
  ])
}

const DrawerContent: React.FC<{
  resourceId: number
}> = ({ resourceId }) => {
  const resource = useLearningResourcesDetail(Number(resourceId))
  useCapturePageView(Number(resourceId))

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

const useOpenLearningResourceDrawer = () => {
  const searchParams = useSearchParams()
  const router = useRouter();

  const openLearningResourceDrawer = React.useCallback(
    (resourceId: number) => {
      // TODO can use navigate Location API with Next.js
      // setSearchParams((current) => {
      //   const copy = new URLSearchParams(current)
      //   copy.set(RESOURCE_DRAWER_QUERY_PARAM, resourceId.toString())
      //   return copy
      // })

      // TODO
      router.push(`?${RESOURCE_DRAWER_QUERY_PARAM}=${resourceId}`)
    },
    [searchParams],
  )
  return openLearningResourceDrawer
}

const useResourceDrawerHref = () => {
  const search = useSearchParams()
  const params = useParams();

  return useCallback(
    (id: number) => {

      return `?${window.location.hash}`

      // TODO
      // search.set(RESOURCE_DRAWER_QUERY_PARAM, id.toString())
      // return `?${search.toString()}${window.location.hash}`
    },
    [search, params],
  )
}

export default LearningResourceDrawer
export { useOpenLearningResourceDrawer, useResourceDrawerHref }

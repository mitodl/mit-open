import React, { Suspense, useCallback, useMemo } from "react"
import {
  RoutedDrawer,
  LearningResourceExpanded,
  imgConfigs,
} from "ol-components"
import type {
  LearningResourceCardProps,
  RoutedDrawerProps,
} from "ol-components"
import { useLearningResourcesDetail } from "api/hooks/learningResources"
import {
  usePathname,
  useSearchParams,
  useRouter,
  ReadonlyURLSearchParams,
} from "next/navigation"

import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import { useUserMe } from "api/hooks/user"
import NiceModal from "@ebay/nice-modal-react"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import * as urls from "@/common/urls"

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
/**
 * Convert HTML to plaintext, removing any HTML tags.
 * This conversion method has some issues:
 * 1. It is unsafe for untrusted HTML
 * 2. It must be run in a browser, not on a server.
 */
// eslint-disable-next-line camelcase
// const unsafe_html2plaintext = (text: string) => {
//   const div = document.createElement("div")
//   div.innerHTML = text
//   return div.textContent || div.innerText || ""
// }

const DrawerContent: React.FC<{
  resourceId: number
}> = ({ resourceId }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const resource = useLearningResourcesDetail(Number(resourceId))
  const { data: user } = useUserMe()
  const handleAddToLearningPathClick: LearningResourceCardProps["onAddToLearningPathClick"] =
    useMemo(() => {
      if (user?.is_learning_path_editor) {
        return (event, resourceId: number) => {
          NiceModal.show(AddToLearningPathDialog, { resourceId })
        }
      }
      return null
    }, [user])
  const handleAddToUserListClick: LearningResourceCardProps["onAddToUserListClick"] =
    useMemo(() => {
      if (user?.is_authenticated) {
        return (event, resourceId: number) => {
          NiceModal.show(AddToUserListDialog, { resourceId })
        }
      }
      return null
    }, [user])

  return (
    <>
      <LearningResourceExpanded
        imgConfig={imgConfigs.large}
        resource={resource.data}
        user={user}
        onAddToLearningPathClick={handleAddToLearningPathClick}
        onAddToUserListClick={handleAddToUserListClick}
        signupUrl={urls.login({ pathname, searchParams })}
      />
    </>
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
    <Suspense>
      <RoutedDrawer
        anchor="right"
        requiredParams={RESOURCE_DRAWER_PARAMS}
        PaperProps={PAPER_PROPS}
      >
        {({ params }) => {
          return <DrawerContent resourceId={Number(params.resource)} />
        }}
      </RoutedDrawer>
    </Suspense>
  )
}

const getOpenDrawerSearchParams = (
  current: ReadonlyURLSearchParams,
  resourceId: number,
) => {
  const newSearchParams = new URLSearchParams(current)
  newSearchParams.set(RESOURCE_DRAWER_QUERY_PARAM, resourceId.toString())
  return newSearchParams
}

const useOpenLearningResourceDrawer = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

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

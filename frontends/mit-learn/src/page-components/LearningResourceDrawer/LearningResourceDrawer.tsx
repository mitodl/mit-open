import React, { useEffect, useCallback, useMemo } from "react"
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
import { useSearchParams, useLocation } from "react-router-dom"
import { RESOURCE_DRAWER_QUERY_PARAM } from "@/common/urls"
import { usePostHog } from "posthog-js/react"
import MetaTags from "@/page-components/MetaTags/MetaTags"
import { useUserMe } from "api/hooks/user"
import NiceModal from "@ebay/nice-modal-react"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import { SignupPopover } from "../SignupPopover/SignupPopover"

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

/**
 * Convert HTML to plaintext, removing any HTML tags.
 * This conversion method has some issues:
 * 1. It is unsafe for untrusted HTML
 * 2. It must be run in a browser, not on a server.
 */
// eslint-disable-next-line camelcase
const unsafe_html2plaintext = (text: string) => {
  const div = document.createElement("div")
  div.innerHTML = text
  return div.textContent || div.innerText || ""
}

const DrawerContent: React.FC<{
  resourceId: number
}> = ({ resourceId }) => {
  const resource = useLearningResourcesDetail(Number(resourceId))
  const [signupEl, setSignupEl] = React.useState<HTMLElement | null>(null)
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
      return (event, resourceId: number) => {
        if (!user?.is_authenticated) {
          setSignupEl(event.currentTarget)
          return
        }
        NiceModal.show(AddToUserListDialog, { resourceId })
      }
    }, [user])
  useCapturePageView(Number(resourceId))

  return (
    <>
      <MetaTags
        title={resource.data?.title}
        description={unsafe_html2plaintext(resource.data?.description ?? "")}
        image={resource.data?.image?.url}
        imageAlt={resource.data?.image?.alt}
        isResourceDrawer={true}
      />
      <LearningResourceExpanded
        imgConfig={imgConfigs.large}
        resource={resource.data}
        user={user}
        onAddToLearningPathClick={handleAddToLearningPathClick}
        onAddToUserListClick={handleAddToUserListClick}
      />
      <SignupPopover anchorEl={signupEl} onClose={() => setSignupEl(null)} />
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

const useResourceDrawerHref = () => {
  const [search] = useSearchParams()
  const { hash } = useLocation()

  return useCallback(
    (id: number) => {
      search.set(RESOURCE_DRAWER_QUERY_PARAM, id.toString())

      return `?${search.toString()}${hash}`
    },
    [search, hash],
  )
}

export default LearningResourceDrawer
export { useOpenLearningResourceDrawer, useResourceDrawerHref }

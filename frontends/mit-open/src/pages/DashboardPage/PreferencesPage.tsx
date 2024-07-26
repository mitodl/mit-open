import React from "react"
import { Profile, useProfileMeMutation } from "api/hooks/profile"
import { useUserMe } from "api/hooks/user"
import {
  useSearchSubscriptionDelete,
  useSearchSubscriptionList,
} from "api/hooks/searchSubscription"

type Props = {
  profile: Profile
}

const PreferencesPage: React.FC<Props> = () => {
  const { isLoading: isSaving, mutateAsync } = useProfileMeMutation()
  const { data: user } = useUserMe()
  const subscriptionDelete = useSearchSubscriptionDelete()
  const subscriptionList = useSearchSubscriptionList(subscribeParams, {
    enabled: !!user?.is_authenticated,
  })
  console.log(profile, isLoading, isSaving, mutateAsync, subscriptionDelete)

  if (!user || subscriptionList.isLoading) return null
  console.log(subscriptionList)

  return <></>
}

export { PreferencesPage }

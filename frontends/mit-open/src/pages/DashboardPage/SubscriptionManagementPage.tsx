import React from "react"
import { Profile, useProfileMeMutation } from "api/hooks/profile"

type Props = {
  profile: Profile
}

const SubscriptionManagementPage: React.FC<Props> = ({ profile }) => {
  const { isLoading: isSaving, mutateAsync } = useProfileMeMutation()
  console.log(profile, isLoading, isSaving, mutateAsync)
  return <></>
}

export { SubscriptionManagementPage }

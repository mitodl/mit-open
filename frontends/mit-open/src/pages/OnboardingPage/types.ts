import { PatchedProfileRequest } from "api/v0"
import { Profile } from "api/hooks/profile"

export type StepUpdateFunc = (fields: PatchedProfileRequest) => void

export interface StepProps {
  onUpdate: StepUpdateFunc
  profile: Profile
}

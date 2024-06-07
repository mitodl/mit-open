import React from "react"

import type { Profile, PatchedProfileRequest } from "api/v0"

export type ProfileFieldUpdateable = keyof PatchedProfileRequest & keyof Profile

export type ProfileFieldUpdateFunc<
  FieldName extends ProfileFieldUpdateable = ProfileFieldUpdateable,
> = (name: FieldName, value: PatchedProfileRequest[FieldName]) => void

export interface ProfileFieldUpdateProps<
  FieldName extends ProfileFieldUpdateable,
> {
  onUpdate: ProfileFieldUpdateFunc<FieldName>
  value?: Profile[FieldName]
  label: React.ReactNode
}

export type ProfileFieldStateHook<
  T extends ProfileFieldUpdateable,
  E = React.ChangeEventHandler,
> = (value: Profile[T], onUpdate: ProfileFieldUpdateFunc<T>) => [Profile[T], E]

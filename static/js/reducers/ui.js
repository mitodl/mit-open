// @flow
import R from "ramda"

import {
  SET_SHOW_DRAWER_DESKTOP,
  SET_SHOW_DRAWER_MOBILE,
  SET_SNACKBAR_MESSAGE,
  SHOW_DIALOG,
  HIDE_DIALOG,
  SHOW_DROPDOWN,
  HIDE_DROPDOWN
} from "../actions/ui"

import type { Action } from "../flow/reduxTypes"

export type SnackbarState = {
  id: number,
  message: string,
  actionText: ?string,
  timeout: ?number
}

export type UIState = {
  showDrawerDesktop: boolean,
  showDrawerMobile: boolean,
  snackbar: ?SnackbarState,
  dialogs: Set<string>,
  dropdownMenus: Set<string>
}

export const INITIAL_UI_STATE: UIState = {
  showDrawerDesktop: true,
  showDrawerMobile:  false,
  snackbar:          null,
  dialogs:           new Set(),
  dropdownMenus:     new Set()
}

// this generates a new sequential id for each snackbar state that is pushed
// this ensures the snack will display for each message even if they repeat
const nextSnackbarId = (snackbar: ?SnackbarState): number =>
  snackbar ? snackbar.id + 1 : 0

const updateVisibilitySet = (
  dialogs: Set<string>,
  dialogKey: string,
  show: boolean
) =>
  show
    ? new Set([...dialogs, dialogKey])
    : new Set([...dialogs].filter(R.complement(R.equals)(dialogKey)))

export const ui = (
  state: UIState = INITIAL_UI_STATE,
  action: Action<any, null>
): UIState => {
  switch (action.type) {
  case SET_SHOW_DRAWER_DESKTOP:
    return { ...state, showDrawerDesktop: action.payload }
  case SET_SHOW_DRAWER_MOBILE:
    return { ...state, showDrawerMobile: action.payload }
  case SET_SNACKBAR_MESSAGE:
    return {
      ...state,
      snackbar: {
        ...action.payload,
        id: nextSnackbarId(state.snackbar)
      }
    }
  case SHOW_DIALOG:
    return {
      ...state,
      dialogs: updateVisibilitySet(state.dialogs, action.payload, true)
    }
  case HIDE_DIALOG:
    return {
      ...state,
      dialogs: updateVisibilitySet(state.dialogs, action.payload, false)
    }
  case SHOW_DROPDOWN:
    return {
      ...state,
      dropdownMenus: updateVisibilitySet(
        state.dropdownMenus,
        action.payload,
        true
      )
    }
  case HIDE_DROPDOWN:
    return {
      ...state,
      dropdownMenus: updateVisibilitySet(
        state.dropdownMenus,
        action.payload,
        false
      )
    }
  }
  return state
}

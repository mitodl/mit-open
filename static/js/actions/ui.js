// @flow
import { createAction } from "redux-actions"

export const SET_SHOW_DRAWER = "SET_SHOW_DRAWER"
export const setShowDrawer = createAction(SET_SHOW_DRAWER)

export const SET_SNACKBAR_MESSAGE = "SET_SNACKBAR_MESSAGE"
export const setSnackbarMessage = createAction(SET_SNACKBAR_MESSAGE)

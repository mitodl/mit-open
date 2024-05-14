import React, { useCallback, useEffect, useMemo } from "react"
import Drawer from "@mui/material/Drawer"
import type { DrawerProps } from "@mui/material/Drawer"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import { ActionButton } from "../Button/Button"
import CloseIcon from "@mui/icons-material/Close"
import { useSearchParams } from "react-router-dom"
import { useToggle } from "ol-utilities"

const closeSx: React.CSSProperties = {
  position: "absolute",
  top: "0px",
  right: "0px",
}

type ChildParams<K extends string, R extends K> = Record<K, string | null> &
  Record<R, string>

type RoutedDrawerProps<K extends string = string, R extends K = K> = {
  params?: readonly K[]
  requiredParams: readonly R[]
  onView?: () => void
  children: (childProps: {
    params: ChildParams<K, R>
    closeDrawer: () => void
  }) => React.ReactNode
} & Omit<DrawerProps, "open" | "onClose" | "children">

const RoutedDrawer = <K extends string, R extends K = K>(
  props: RoutedDrawerProps<K, R>,
) => {
  const { requiredParams, children, onView, ...others } = props
  const { params = requiredParams } = props
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useToggle(false)

  const childParams = useMemo(() => {
    return Object.fromEntries(
      params.map((name) => [name, searchParams.get(name)] as const),
    ) as Record<K, string | null>
  }, [searchParams, params])

  const requiredArePresent = requiredParams.every(
    (name) => childParams[name] !== null,
  )

  useEffect(() => {
    if (requiredArePresent) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [requiredArePresent, setOpen, requiredParams])

  const removeUrlParams = useCallback(() => {
    setSearchParams((current) => {
      const newSearchParams = new URLSearchParams(current)
      params.forEach((param) => {
        newSearchParams.delete(param)
      })
      return newSearchParams
    })
  }, [setSearchParams, params])

  return (
    <ClickAwayListener onClickAway={setOpen.off}>
      <Drawer
        open={open}
        onTransitionExited={removeUrlParams}
        onClose={setOpen.off}
        {...others}
      >
        {
          <>
            {requiredArePresent &&
              children?.({
                params: childParams as Record<K, string>,
                closeDrawer: setOpen.off,
              })}
            <ActionButton
              style={closeSx}
              variant="text"
              color="secondary"
              size="small"
              onClick={setOpen.off}
              aria-label="Close"
            >
              <CloseIcon fontSize="large" />
            </ActionButton>
          </>
        }
      </Drawer>
    </ClickAwayListener>
  )
}

export { RoutedDrawer }
export type { RoutedDrawerProps }

import React, { useCallback, useMemo, useState } from "react"
import { useToggle } from "ol-util"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import invariant from "tiny-invariant"
import { Link , LinkProps } from "react-router-dom"

interface SimpleMenuItem<K extends string = string> {
  key: K
  label: string
  icon?: React.ReactNode
}

type SimpleMenuProps<K extends string> = {
  items: SimpleMenuItem<K>[]
  actionsOrLinks: Record<K, LinkProps["to"] | (() => void)>
  trigger: React.ReactElement
}

const SimpleMenu = <K extends string>({
  items,
  actionsOrLinks,
  trigger: _trigger,
}: SimpleMenuProps<K>) => {
  const [open, setOpen] = useToggle(false)
  const [el, setEl] = useState<HTMLElement | null>(null)

  const trigger = useMemo(() => {
    return React.cloneElement(_trigger, {
      onClick: (e: React.MouseEvent) => {
        setOpen((currentlyOpen) => !currentlyOpen)
        _trigger.props.onClick?.(e)
      },
      ref: setEl,
    })
  }, [_trigger, setOpen])

  const handleItemClick: React.MouseEventHandler = useCallback(
    (e) => {
      const key = e.currentTarget.getAttribute("data-key") as K
      invariant(key, "Missing data-key")
      const actionOrLink = actionsOrLinks[key]
      if (typeof actionOrLink === "function") {
        actionOrLink()
      }
      setOpen(false)
    },
    [actionsOrLinks, setOpen],
  )

  return (
    <>
      {trigger}
      <Menu open={open} anchorEl={el} onClose={setOpen.off}>
        {items.map((item) => {
          const actionOrLink = actionsOrLinks[item.key]
          return (
            <MenuItem
              key={item.key}
              data-key={item.key}
              onClick={handleItemClick}
            >
              {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
              {typeof actionOrLink === "function" ? (
                item.label
              ) : (
                <Link to={actionOrLink}>{item.label}</Link>
              )}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

export { SimpleMenu }
export type { SimpleMenuProps, SimpleMenuItem }

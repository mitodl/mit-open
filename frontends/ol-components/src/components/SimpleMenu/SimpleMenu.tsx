import React, { useCallback, useMemo, useState } from "react"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import { Link as RouterLink } from "react-router-dom"
import type { LinkProps as RouterLinkProps } from "react-router-dom"

/**
 * See https://mui.com/material-ui/guides/routing/#global-theme-link
 */
const LinkBehavior = React.forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, "to"> & { href: RouterLinkProps["to"] }
>((props, ref) => {
  const { href, ...other } = props
  // Map href (Material UI) -> to (react-router)
  return <RouterLink ref={ref} to={href} {...other} />
})

interface SimpleMenuItem {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  LinkComponent?: React.ElementType
}

type SimpleMenuProps = {
  items: SimpleMenuItem[]
  trigger: React.ReactElement
  onVisibilityChange?: (visible: boolean) => void
}

/**
 * A wrapper around MUI's Menu that handles visibility, icons, placement
 * relative to trigger, and links as children.
 *
 * By default <SimpleMenu /> will render links using React Router's <Link />
 * component for SPA routing. For external links or links where a full reload
 * is desirable, an anchor tag is more appropriate. Use `LinkComponent: "a"`
 * in such cases.
 */
const SimpleMenu: React.FC<SimpleMenuProps> = ({
  items,
  trigger: _trigger,
  onVisibilityChange,
}) => {
  const [open, _setOpen] = useState(false)
  const setOpen = useCallback(
    (newValue: boolean) => {
      _setOpen(newValue)
      if (newValue !== open) {
        onVisibilityChange?.(newValue)
      }
    },
    [open, onVisibilityChange],
  )

  const [el, setEl] = useState<HTMLElement | null>(null)

  const trigger = useMemo(() => {
    return React.cloneElement(_trigger, {
      onClick: (e: React.MouseEvent) => {
        setOpen(!open)
        _trigger.props.onClick?.(e)
      },
      ref: setEl,
    })
  }, [_trigger, setOpen, open])

  return (
    <>
      {trigger}
      <Menu open={open} anchorEl={el} onClose={() => setOpen(false)}>
        {items.map((item) => {
          const linkProps = item.href
            ? {
                /**
                 * Used to render the MenuItem as a react router link (or
                 * specified link component) instead of a <li>.
                 *
                 * Using `<MenuItem component={LinkComponent} />` has the
                 * following consequences
                 *
                 * Good:
                 *  - the whole MenuItem is clickable as a link
                 *  - the MenuItem maintains its uparrow/downarrow keyboard
                 *    within parent Menu.
                 *  - the element's role stays `menuitem`
                 * Bad:
                 *  - Technically, this is invalid HTML: The child of a <ul>
                 *    should be a <li>.
                 *
                 * See:
                 *  - https://github.com/mui/material-ui/issues/33268
                 *  - https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
                 */
                component: item.LinkComponent ?? LinkBehavior,
                href: item.href,
              }
            : {}
          const onClick = () => {
            item.onClick?.()
            setOpen(false)
          }
          return (
            <MenuItem {...linkProps} key={item.key} onClick={onClick}>
              {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
              {item.label}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

export { SimpleMenu }
export type { SimpleMenuProps, SimpleMenuItem }

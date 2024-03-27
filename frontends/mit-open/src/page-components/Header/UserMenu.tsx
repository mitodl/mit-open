import React, { useState, useMemo } from "react"
import { Avatar, Badge, SimpleMenu, styled } from "ol-components"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp"
import type { BadgeProps, SimpleMenuItem, AvatarProps } from "ol-components"
import * as urls from "@/common/urls"
import { Permissions, hasPermission } from "@/common/permissions"
import type { User } from "@/types/settings"
import PersonIcon from "@mui/icons-material/Person"
import { useLocation } from "react-router"
import type { Location } from "react-router"

const StyledBadge = styled(Badge)`
  pointer-events: none;
`

const SmallAvatar = styled(Avatar)<AvatarProps>`
  pointer-events: all;
  height: 35px;
  width: 35px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
`

const badgeAnchorOrigin: BadgeProps["anchorOrigin"] = {
  vertical: "bottom",
  horizontal: "right",
}

type AuthMenuItem = SimpleMenuItem & {
  allow: boolean
}

const getUserMenuItems = (location: Location): SimpleMenuItem[] => {
  const items: AuthMenuItem[] = [
    {
      label: "Log in",
      key: "login",
      allow: !hasPermission(Permissions.Authenticated),
      href: urls.login({
        pathname: location.pathname,
        search: location.search,
      }),
      LinkComponent: "a",
    },
    {
      label: "Dashboard",
      key: "dashboard",
      allow: hasPermission(Permissions.Authenticated),
      href: urls.DASHBOARD,
    },
    {
      label: "User Lists",
      key: "userlists",
      allow: hasPermission(Permissions.Authenticated),
      href: urls.USERLIST_LISTING,
    },
    {
      label: "Learning Paths",
      key: "learningpaths",
      allow: hasPermission(Permissions.LearningPathEditor),
      href: urls.LEARNINGPATH_LISTING,
    },
    {
      label: "Log out",
      key: "logout",
      allow: hasPermission(Permissions.Authenticated),
      href: urls.LOGOUT,
      LinkComponent: "a",
    },
  ]
  return items.filter(({ allow }) => allow).map(({ allow, ...item }) => item)
}

const UserIcon: React.FC<{ user: User }> = ({ user }) => {
  if (!hasPermission(Permissions.Authenticated)) return <PersonIcon />
  const first = user.first_name?.[0] ?? ""
  const last = user.last_name?.[0] ?? ""
  const initials = `${first}${last}`
  return initials ? initials : <PersonIcon />
}

const UserMenu: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  const items = useMemo(() => getUserMenuItems(location), [location])

  return (
    <SimpleMenu
      onVisibilityChange={setVisible}
      items={items}
      trigger={
        <StyledBadge
          overlap="circular"
          anchorOrigin={badgeAnchorOrigin}
          badgeContent={visible ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        >
          <SmallAvatar component="button" aria-label="User Menu">
            <UserIcon user={window.SETTINGS.user} />
          </SmallAvatar>
        </StyledBadge>
      }
    ></SimpleMenu>
  )
}

export default UserMenu

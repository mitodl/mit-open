import React, { useState } from "react"
import { Avatar, Badge, SimpleMenu, styled } from "ol-components"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp"
import type { BadgeProps, SimpleMenuItem, AvatarProps } from "ol-components"
import * as urls from "@/common/urls"
import PersonIcon from "@mui/icons-material/Person"
import { useLocation } from "react-router"
import { useUserMe, User } from "api/hooks/user"

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

const UserIcon: React.FC<{ user: User }> = ({ user }) => {
  const first = user.first_name?.[0] ?? ""
  const last = user.last_name?.[0] ?? ""
  return `${first}${last}` || <PersonIcon />
}

const UserMenu: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  const { isLoading, data: user } = useUserMe()

  if (isLoading) {
    return null
  }

  const items: AuthMenuItem[] = [
    {
      label: "Log in",
      key: "login",
      allow: !user?.is_authenticated,
      href: urls.login({
        pathname: location.pathname,
        search: location.search,
      }),
      LinkComponent: "a",
    },
    {
      label: "Dashboard",
      key: "dashboard",
      allow: !!user?.is_authenticated,
      href: urls.DASHBOARD,
    },
    {
      label: "User Lists",
      key: "userlists",
      allow: !!user?.is_authenticated,
      href: urls.USERLIST_LISTING,
    },
    {
      label: "Learning Paths",
      key: "learningpaths",
      allow: !!user?.is_learning_path_editor,
      href: urls.LEARNINGPATH_LISTING,
    },
    {
      label: "Log out",
      key: "logout",
      allow: !!user?.is_authenticated,
      href: urls.LOGOUT,
      LinkComponent: "a",
    },
  ]

  return (
    <SimpleMenu
      onVisibilityChange={setVisible}
      items={items
        .filter(({ allow }) => allow)
        .map(({ allow, ...item }) => item)}
      trigger={
        <StyledBadge
          overlap="circular"
          anchorOrigin={badgeAnchorOrigin}
          badgeContent={visible ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        >
          <SmallAvatar component="button" aria-label="User Menu">
            {user?.is_authenticated ? <UserIcon user={user} /> : <PersonIcon />}
          </SmallAvatar>
        </StyledBadge>
      }
    />
  )
}

export default UserMenu

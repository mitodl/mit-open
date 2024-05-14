import React, { useState } from "react"
import { SimpleMenu, styled } from "ol-components"
import type { MenuOverrideProps, SimpleMenuItem } from "ol-components"
import * as urls from "@/common/urls"
import {
  RiAccountCircleFill,
  RiArrowUpSLine,
  RiArrowDownSLine,
} from "@remixicon/react"
import { useUserMe, User } from "api/hooks/user"

const UserMenuContainer = styled.div({
  display: "flex",
  cursor: "pointer",
})

const StyledUserIcon = styled(RiAccountCircleFill)(({ theme }) => ({
  width: "22px",
  height: "22px",
  color: theme.custom.colors.darkGray1,
}))

type UserMenuItem = SimpleMenuItem & {
  allow: boolean
}

const UserNameContainer = styled.span(({ theme }) => ({
  color: theme.custom.colors.darkGray1,
  padding: "0 12px",
}))

const UserName: React.FC<{ user: User | undefined }> = ({ user }) => {
  const first = user?.first_name ?? ""
  const last = user?.last_name ?? ""
  return (
    <UserNameContainer>
      {first} {last}
    </UserNameContainer>
  )
}

const UserMenuChevron: React.FC<{ open: boolean }> = ({ open }) => {
  return open ? <RiArrowUpSLine /> : <RiArrowDownSLine />
}

const UserMenu: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const { isLoading, data: user } = useUserMe()

  if (isLoading) {
    return null
  }

  const items: UserMenuItem[] = [
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

  const menuOverrideProps: MenuOverrideProps = {
    anchorOrigin: { horizontal: "right", vertical: "bottom" },
    transformOrigin: { horizontal: "right", vertical: "top" },
  }

  return (
    <SimpleMenu
      menuOverrideProps={menuOverrideProps}
      onVisibilityChange={setVisible}
      items={items
        .filter(({ allow }) => allow)
        .map(({ allow, ...item }) => item)}
      trigger={
        <UserMenuContainer>
          <StyledUserIcon />
          <UserName user={user} />
          <UserMenuChevron open={visible} />
        </UserMenuContainer>
      }
    />
  )
}

export default UserMenu

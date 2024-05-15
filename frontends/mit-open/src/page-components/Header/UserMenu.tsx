import React, { useState } from "react"
import { Button, SimpleMenu, styled } from "ol-components"
import type { MenuOverrideProps, SimpleMenuItem } from "ol-components"
import * as urls from "@/common/urls"
import {
  RiAccountCircleFill,
  RiArrowUpSLine,
  RiArrowDownSLine,
} from "@remixicon/react"
import { useUserMe, User } from "api/hooks/user"
import { LOGIN } from "@/common/urls"

const FlexContainer = styled.div({
  display: "flex",
  alignItems: "center",
})

const UserMenuContainer = styled.button({
  display: "flex",
  cursor: "pointer",
  background: "none",
  color: "inherit",
  border: "none",
  padding: "0",
  font: "inherit",
})

const LoginLink = styled.a(({ theme }) => ({
  paddingRight: "32px",
  "&:hover": {
    textDecoration: "none",
  },
  [theme.breakpoints.down("sm")]: {
    padding: "0",
    ".login-button-desktop": {
      display: "none",
    },
    ".login-button-mobile": {
      display: "flex",
    },
  },
  [theme.breakpoints.up("sm")]: {
    ".login-button-desktop": {
      display: "flex",
    },
    ".login-button-mobile": {
      display: "none",
    },
  },
}))

const UserIcon = styled(RiAccountCircleFill)(({ theme }) => ({
  width: "20px",
  height: "20px",
  color: theme.custom.colors.darkGray1,
}))

type UserMenuItem = SimpleMenuItem & {
  allow: boolean
}

const UserNameContainer = styled.span(({ theme }) => ({
  color: theme.custom.colors.darkGray1,
  padding: "0 12px",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}))

const UserName: React.FC<{ user: User | undefined }> = ({ user }) => {
  const first = user?.first_name ?? ""
  const last = user?.last_name ?? ""
  return (
    <UserNameContainer>
      {first}
      {first && last ? " " : ""}
      {last}
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
  if (user?.is_authenticated) {
    return (
      <SimpleMenu
        menuOverrideProps={menuOverrideProps}
        onVisibilityChange={setVisible}
        items={items
          .filter(({ allow }) => allow)
          .map(({ allow, ...item }) => item)}
        trigger={
          <UserMenuContainer role="button" aria-label="User Menu">
            <UserIcon data-testid="UserIcon" />
            <UserName user={user} />
            {user?.is_authenticated ? <UserMenuChevron open={visible} /> : ""}
          </UserMenuContainer>
        }
      />
    )
  } else {
    return (
      <LoginLink href={LOGIN}>
        <FlexContainer className="login-button-desktop">
          <Button edge="rounded" size="small">
            Sign Up / Login
          </Button>
        </FlexContainer>
        <FlexContainer className="login-button-mobile">
          <UserIcon data-testid="UserIcon" />
        </FlexContainer>
      </LoginLink>
    )
  }
}

export default UserMenu

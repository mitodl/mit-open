import React, { useState } from "react"
import { ActionButtonLink, ButtonLink, SimpleMenu, styled } from "ol-components"
import type { MenuOverrideProps, SimpleMenuItem } from "ol-components"
import * as urls from "@/common/urls"
import {
  RiAccountCircleFill,
  RiArrowUpSLine,
  RiArrowDownSLine,
} from "@remixicon/react"
import { useUserMe, User } from "api/hooks/user"
import { useLocation } from "react-router"

const FlexContainer = styled.div({
  display: "flex",
  alignItems: "center",
})

const UserMenuContainer = styled.button({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  background: "none",
  color: "inherit",
  border: "none",
  padding: "0",
  font: "inherit",
})

const LoginButtonContainer = styled(FlexContainer)(({ theme }) => ({
  paddingLeft: "24px",
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
  width: "24px",
  height: "24px",
  color: theme.custom.colors.black,
}))

type UserMenuItem = SimpleMenuItem & {
  allow: boolean
}

const UserNameContainer = styled.span(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  padding: "0 12px",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
  ...theme.typography.body2,
}))

const UserName: React.FC<{ user: User | undefined }> = ({ user }) => {
  return <UserNameContainer>{user?.profile?.name ?? ""}</UserNameContainer>
}

const UserMenuChevron: React.FC<{ open: boolean }> = ({ open }) => {
  return open ? <RiArrowUpSLine /> : <RiArrowDownSLine />
}

type DeviceType = "mobile" | "desktop"
type UserMenuProps = {
  variant?: DeviceType
}

const UserMenu: React.FC<UserMenuProps> = ({ variant }) => {
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  const { isLoading, data: user } = useUserMe()
  if (isLoading) {
    return null
  }
  const loginUrl = urls.login({
    pathname: location.pathname,
    search: location.search,
  })

  const items: UserMenuItem[] = [
    {
      label: "Dashboard",
      key: "dashboard",
      allow: !!user?.is_authenticated,
      href: urls.DASHBOARD_HOME,
    },
    {
      label: "Learning Paths",
      key: "learningpaths",
      allow: !!user?.is_learning_path_editor,
      href: urls.LEARNINGPATH_LISTING,
    },
    {
      label: "Log Out",
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
      <LoginButtonContainer data-testid="login-button-container">
        {variant === "desktop" ? (
          <FlexContainer className="login-button-desktop">
            <ButtonLink
              data-testid="login-button-desktop"
              size="small"
              reloadDocument={true}
              href={loginUrl}
            >
              Log In
            </ButtonLink>
          </FlexContainer>
        ) : (
          ""
        )}
        {variant === "mobile" ? (
          <FlexContainer className="login-button-mobile">
            <ActionButtonLink
              data-testid="login-button-mobile"
              edge="circular"
              variant="text"
              reloadDocument={true}
              href={loginUrl}
              aria-label="Log in"
            >
              <UserIcon data-testid="UserIcon" />
            </ActionButtonLink>
          </FlexContainer>
        ) : (
          ""
        )}
      </LoginButtonContainer>
    )
  }
}

export default UserMenu

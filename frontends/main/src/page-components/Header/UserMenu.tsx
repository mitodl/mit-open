"use client"

import React, { useState } from "react"
import {
  ActionButtonLink,
  ButtonLink,
  SimpleMenu,
  styled,
  theme,
} from "ol-components"
import type { MenuOverrideProps, SimpleMenuItem } from "ol-components"
import * as urls from "@/common/urls"
import {
  RiAccountCircleFill,
  RiArrowUpSLine,
  RiArrowDownSLine,
} from "@remixicon/react"
import { useUserMe, User } from "api/hooks/user"
import { usePathname, useSearchParams } from "next/navigation"
import MITLogoLink from "@/components/MITLogoLink/MITLogoLink"

const FlexContainer = styled.div({
  display: "flex",
  alignItems: "center",
})

const UserMenuContainer = styled.button(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  background: "none",
  color: theme.custom.colors.white,
  height: "40px",
  border: `1px solid ${theme.custom.colors.silverGrayDark}`,
  borderRadius: "4px",
  padding: "2px 8px",
  gap: "8px",
  font: "inherit",
  margin: "0 16px",
  opacity: 0.75,
  "&:hover": {
    opacity: 1,
  },
  [theme.breakpoints.down("sm")]: {
    border: "none",
    opacity: 1,
    gap: "2px",
    padding: "4px 0",
    margin: "0px 24px",
  },
}))

const LoginButtonContainer = styled(FlexContainer)(({ theme }) => ({
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

const DesktopLoginButton = styled(ButtonLink)({
  height: "40px",
  padding: "18px 12px",
  margin: "0 16px",
})

const MobileLoginButton = styled(ActionButtonLink)({
  width: "24px",
  height: "24px",
  margin: "0 24px",
})

const UserIcon = styled(RiAccountCircleFill)(({ theme }) => ({
  color: theme.custom.colors.white,
}))

type UserMenuItem = SimpleMenuItem & {
  allow: boolean
}

const UserNameContainer = styled.span(({ theme }) => ({
  color: theme.custom.colors.white,
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

const StyledMITLogoLink = styled(MITLogoLink)(({ theme }) => ({
  img: {
    width: "64px",
    height: "32px",
    marginLeft: "16px",
    [theme.breakpoints.down("sm")]: {
      width: "48px",
      height: "24px",
      marginLeft: "0",
    },
  },
}))

type DeviceType = "mobile" | "desktop"
type UserMenuProps = {
  variant?: DeviceType
}

const UserMenu: React.FC<UserMenuProps> = ({ variant }) => {
  const [visible, setVisible] = useState(false)

  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { isLoading, data: user } = useUserMe()
  if (isLoading) {
    return null
  }
  const loginUrl = urls.login({ pathname, searchParams })

  const items: UserMenuItem[] = [
    {
      label: "Home",
      key: "home",
      allow: true,
      href: urls.HOME,
    },
    {
      label: "Dashboard",
      key: "dashboard",
      allow: !!user?.is_authenticated,
      href: urls.DASHBOARD_HOME,
      // LinkComponent: Link
    },
    {
      label: "Learning Paths",
      key: "learningpaths",
      allow: !!user?.is_learning_path_editor,
      href: urls.LEARNINGPATH_LISTING,
      // LinkComponent: Link
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
    anchorOrigin: { horizontal: "left", vertical: "bottom" },
    transformOrigin: { horizontal: "left", vertical: "top" },
    slotProps: {
      paper: {
        sx: {
          borderRadius: "0px 0px 5px 5px",
          backgroundColor: theme.custom.colors.darkGray1,
          padding: "0 16px",
          ".MuiMenu-list": {
            padding: "8px 0",
            ".MuiMenuItem-root": {
              backgroundColor: theme.custom.colors.darkGray1,
              color: theme.custom.colors.white,
              padding: "8px 0",
              "&:hover": {
                textDecoration: "underline",
              },
            },
          },
          ...theme.typography.body2,
        },
      },
    },
  }

  if (user?.is_authenticated) {
    return (
      <>
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
        <StyledMITLogoLink logo="mit_white" />
      </>
    )
  } else {
    return (
      <LoginButtonContainer data-testid="login-button-container">
        {variant === "desktop" ? (
          <FlexContainer className="login-button-desktop">
            <DesktopLoginButton
              data-testid="login-button-desktop"
              size="small"
              rawAnchor={true}
              variant="tertiary"
              href={loginUrl}
            >
              Log In
            </DesktopLoginButton>
            <StyledMITLogoLink logo="mit_white" />
          </FlexContainer>
        ) : (
          ""
        )}
        {variant === "mobile" ? (
          <FlexContainer className="login-button-mobile">
            <MobileLoginButton
              data-testid="login-button-mobile"
              edge="circular"
              variant="text"
              rawAnchor={true}
              href={loginUrl}
              aria-label="Log in"
            >
              <UserIcon data-testid="UserIcon" />
            </MobileLoginButton>
            <StyledMITLogoLink logo="mit_white" />
          </FlexContainer>
        ) : (
          ""
        )}
      </LoginButtonContainer>
    )
  }
}

export default UserMenu

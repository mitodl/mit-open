"use client"

import React, { FunctionComponent } from "react"
import type { NavData } from "ol-components"
import {
  styled,
  AppBar,
  Divider,
  NavDrawer,
  Toolbar,
  ClickAwayListener,
  ActionButtonLink,
} from "ol-components"
import {
  RiSearch2Line,
  RiPencilRulerLine,
  RiStackLine,
  RiBookMarkedLine,
  RiPresentationLine,
  RiNodeTree,
  RiVerifiedBadgeLine,
  RiFileAddLine,
  RiTimeLine,
  RiHeartLine,
  RiPriceTag3Line,
  RiAwardLine,
} from "@remixicon/react"
import { useToggle } from "ol-utilities"
import MITLogoLink from "@/components/MITLogoLink/MITLogoLink"
import UserMenu from "./UserMenu"
import { MenuButton } from "./MenuButton"
import {
  DEPARTMENTS,
  TOPICS,
  SEARCH,
  UNITS,
  SEARCH_NEW,
  SEARCH_UPCOMING,
  SEARCH_POPULAR,
  SEARCH_FREE,
  SEARCH_CERTIFICATE,
  SEARCH_COURSE,
  SEARCH_PROGRAM,
  SEARCH_LEARNING_MATERIAL,
} from "@/common/urls"
import { useUserMe } from "api/hooks/user"

const Bar = styled(AppBar)(({ theme }) => ({
  height: "60px",
  padding: "0 8px",
  borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
  backgroundColor: theme.custom.colors.white,
  color: theme.custom.colors.darkGray1,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 2px 10px rgba(120 169 197 / 15%)",
  [theme.breakpoints.down("sm")]: {
    padding: "0",
  },
}))

const FlexContainer = styled.div({
  display: "flex",
  alignItems: "center",
})

const DesktopOnly = styled(FlexContainer)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    display: "flex",
  },
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}))

const MobileOnly = styled(FlexContainer)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    display: "flex",
  },
  [theme.breakpoints.up("sm")]: {
    display: "none",
  },
}))

const StyledToolbar = styled(Toolbar)({
  flex: 1,
})

const LogoLink = styled(MITLogoLink)(({ theme }) => ({
  border: "none",
  position: "relative",
  width: 109,
  height: 40,
  [theme.breakpoints.down("sm")]: {
    marginLeft: "16px",
  },
}))

const LeftDivider = styled(Divider)({
  margin: "0 24px",
  height: "24px",
  alignSelf: "auto",
})

const RightDivider = styled(Divider)(({ theme }) => ({
  margin: "0 32px",
  height: "24px",
  alignSelf: "auto",
  [theme.breakpoints.down("sm")]: {
    margin: "0 16px",
  },
}))

const Spacer = styled.div`
  flex: 1;
`

const StyledSearchIcon = styled(RiSearch2Line)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  margin: "4px 0",
}))

const SearchButton: FunctionComponent = () => {
  return (
    <ActionButtonLink
      edge="circular"
      variant="text"
      reloadDocument={true}
      href={SEARCH}
      aria-label="Search"
    >
      <StyledSearchIcon />
    </ActionButtonLink>
  )
}

const LoggedOutView: FunctionComponent = () => {
  return (
    <FlexContainer>
      <DesktopOnly>
        <SearchButton />
        <UserMenu variant="desktop" />
      </DesktopOnly>
      <MobileOnly>
        <SearchButton />
        <RightDivider orientation="vertical" flexItem />
        <UserMenu variant="mobile" />
      </MobileOnly>
    </FlexContainer>
  )
}

const LoggedInView: FunctionComponent = () => {
  return (
    <FlexContainer>
      <SearchButton />
      <RightDivider orientation="vertical" flexItem />
      <UserMenu />
    </FlexContainer>
  )
}

const UserView: FunctionComponent = () => {
  const { isLoading, data: user } = useUserMe()
  if (isLoading) {
    return null
  }
  return user?.is_authenticated ? <LoggedInView /> : <LoggedOutView />
}

const navData: NavData = {
  sections: [
    {
      title: "LEARN",
      items: [
        {
          title: "Courses",
          icon: <RiPencilRulerLine />,
          description:
            "Single courses on a specific subject, taught by MIT instructors",
          href: SEARCH_COURSE,
        },
        {
          title: "Programs",
          icon: <RiStackLine />,
          description:
            "A series of courses for in-depth learning across a range of topics",
          href: SEARCH_PROGRAM,
        },
        {
          title: "Learning Materials",
          icon: <RiBookMarkedLine />,
          description:
            "Free learning and teaching materials, including videos, podcasts, lecture notes, and more",
          href: SEARCH_LEARNING_MATERIAL,
        },
      ],
    },
    {
      title: "BROWSE",
      items: [
        {
          title: "By Topic",
          icon: <RiPresentationLine />,
          href: TOPICS,
        },
        {
          title: "By Department",
          icon: <RiNodeTree />,
          href: DEPARTMENTS,
        },
        {
          title: "By Provider",
          icon: <RiVerifiedBadgeLine />,
          href: UNITS,
        },
      ],
    },
    {
      title: "DISCOVER LEARNING RESOURCES",
      items: [
        {
          title: "New",
          icon: <RiFileAddLine />,
          href: SEARCH_NEW,
        },
        {
          title: "Upcoming",
          icon: <RiTimeLine />,
          href: SEARCH_UPCOMING,
        },
        {
          title: "Popular",
          href: SEARCH_POPULAR,
          icon: <RiHeartLine />,
        },
        {
          title: "Free",
          icon: <RiPriceTag3Line />,
          href: SEARCH_FREE,
        },
        {
          title: "With Certificate",
          icon: <RiAwardLine />,
          href: SEARCH_CERTIFICATE,
        },
      ],
    },
  ],
}

const Header: FunctionComponent = () => {
  const [drawerOpen, toggleDrawer] = useToggle(false)
  const toggler = (event: React.MouseEvent) => {
    event.nativeEvent.stopImmediatePropagation() // Prevent clicking on "Explore MIT" button from triggering the ClickAwayHandler
    toggleDrawer(!drawerOpen)
  }
  const closeDrawer = (event: MouseEvent | TouchEvent) => {
    if (drawerOpen && event.type !== "touchstart") {
      toggleDrawer(false)
    }
  }

  return (
    <div>
      <Bar position="fixed">
        <StyledToolbar variant="dense">
          <DesktopOnly>
            <LogoLink />
            <LeftDivider orientation="vertical" flexItem />
            <MenuButton
              text="Explore MIT"
              onClick={toggler}
              drawerOpen={drawerOpen}
            />
          </DesktopOnly>
          <MobileOnly>
            <MenuButton onClick={toggler} drawerOpen={drawerOpen} />
            <LogoLink />
          </MobileOnly>
          <Spacer />
          <UserView />
        </StyledToolbar>
      </Bar>
      <ClickAwayListener
        onClickAway={closeDrawer}
        mouseEvent="onPointerDown"
        touchEvent="onTouchStart"
      >
        <div role="presentation">
          <NavDrawer navdata={navData} open={drawerOpen} />
        </div>
      </ClickAwayListener>
    </div>
  )
}

export default Header

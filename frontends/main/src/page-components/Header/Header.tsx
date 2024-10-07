"use client"

import React, { FunctionComponent } from "react"
import type { NavData } from "ol-components"
import {
  styled,
  AppBar,
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
  padding: "16px 8px",
  backgroundColor: theme.custom.colors.navGray,
  boxShadow: "none",
  display: "flex",
  justifyContent: "space-between",
  flexDirection: "column",
  ".MuiToolbar-root": {
    minHeight: "auto",
  },
  [theme.breakpoints.down("sm")]: {
    height: "60px",
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

const StyledMITLogoLink = styled(MITLogoLink)(({ theme }) => ({
  img: {
    height: "24px",
    width: "auto",
    display: "block",
    [theme.breakpoints.down("sm")]: {
      height: "16px",
    },
  },
}))

const Spacer = styled.div({
  flex: "1",
})

const LeftSpacer = styled.div(({ theme }) => ({
  width: "24px",
  [theme.breakpoints.down("sm")]: {
    width: "16px",
  },
}))

const StyledSearchButton = styled(ActionButtonLink)(({ theme }) => ({
  width: "auto",
  height: "auto",
  padding: "4px 16px",
  "&:hover": {
    svg: {
      opacity: 1,
    },
  },
  [theme.breakpoints.down("sm")]: {
    padding: "0",
  },
}))

const StyledSearchIcon = styled(RiSearch2Line)(({ theme }) => ({
  width: "24px",
  height: "24px",
  color: theme.custom.colors.white,
  opacity: 0.5,
  margin: "4px 0",
  [theme.breakpoints.down("sm")]: {
    opacity: 1,
  },
}))

const SearchButton: FunctionComponent = () => {
  return (
    <StyledSearchButton
      edge="circular"
      variant="text"
      rawAnchor={true}
      href={SEARCH}
      aria-label="Search"
    >
      <StyledSearchIcon />
    </StyledSearchButton>
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
        <UserMenu variant="mobile" />
      </MobileOnly>
    </FlexContainer>
  )
}

const LoggedInView: FunctionComponent = () => {
  return (
    <FlexContainer>
      <SearchButton />
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
          title: "Recently Added",
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
            <StyledMITLogoLink logo="learn" />
            <LeftSpacer />
            <MenuButton
              text="Explore MIT"
              onClick={toggler}
              drawerOpen={drawerOpen}
            />
          </DesktopOnly>
          <MobileOnly>
            <MenuButton onClick={toggler} drawerOpen={drawerOpen} />
            <LeftSpacer />
            <StyledMITLogoLink logo="learn" />
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

import React, { FunctionComponent } from "react"
import type { NavData } from "ol-components"
import {
  styled,
  AppBar,
  Divider,
  NavDrawer,
  Toolbar,
  ClickAwayListener,
} from "ol-components"
import { RiSearch2Line } from "@remixicon/react"
import { MITLogoLink, useToggle } from "ol-utilities"
import UserMenu from "./UserMenu"
import { MenuButton } from "./MenuButton"
import {
  DEPARTMENTS,
  RESOURCE_DRAWER_QUERY_PARAM,
  SEARCH,
  querifiedSearchUrl,
} from "@/common/urls"
import { useSearchParams } from "react-router-dom"
import { useUserMe } from "api/hooks/user"

const Bar = styled(AppBar)(({ theme }) => ({
  height: "80px",
  padding: "0 8px",
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.custom.colors.white,
  color: theme.custom.colors.darkGray1,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 2px 10px rgba(120 169 197 / 15%)",
  [theme.breakpoints.down("sm")]: {
    height: "60px",
    padding: "0",
  },
}))

const FlexContainer = styled.div({
  display: "flex",
  alignItems: "center",
})

const FlexReverseMobile = styled(FlexContainer)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    flexDirection: "row-reverse",
  },
}))

const RightContainer = styled(FlexContainer)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    ".logged-out-right-divider": {
      display: "none",
    },
  },
}))

const StyledToolbar = styled(Toolbar)({
  flex: 1,
})

const LogoLink = styled(MITLogoLink)(({ theme }) => ({
  img: {
    width: 109,
    height: 40,
    [theme.breakpoints.down("sm")]: {
      marginLeft: "16px",
    },
  },
}))

const LeftDivider = styled(Divider)(({ theme }) => ({
  margin: "0 24px",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}))

const RightDivider = styled(Divider)(({ theme }) => ({
  margin: "0 32px",
  [theme.breakpoints.down("sm")]: {
    margin: "0 16px",
  },
}))

const Spacer = styled.div`
  flex: 1;
`

const StyledSearchIcon = styled(RiSearch2Line)(({ theme }) => ({
  color: theme.custom.colors.darkGray1,
  margin: "4px 0",
}))

const SearchButton: FunctionComponent = () => {
  return (
    <a href={SEARCH}>
      <FlexContainer>
        <StyledSearchIcon />
      </FlexContainer>
    </a>
  )
}

const LoggedOutView: FunctionComponent = () => {
  return (
    <RightContainer>
      <FlexReverseMobile>
        <UserMenu />
        <RightDivider
          className="logged-out-right-divider"
          orientation="vertical"
          flexItem
        />
        <SearchButton />
      </FlexReverseMobile>
    </RightContainer>
  )
}

const LoggedInView: FunctionComponent = () => {
  return (
    <RightContainer>
      <SearchButton />
      <RightDivider orientation="vertical" flexItem />
      <UserMenu />
    </RightContainer>
  )
}

const navData: NavData = {
  sections: [
    {
      title: "LEARN",
      items: [
        {
          title: "Courses",
          description: "Learn with MIT instructors",
          href: querifiedSearchUrl({ resource_type: "course" }),
        },
        {
          title: "Programs",
          description:
            "Learn in-depth from a series of courses and earn a certificate",
          href: querifiedSearchUrl({ resource_type: "program" }),
        },
        {
          title: "Course Materials",
          description:
            "Free teaching and learning materials including videos, podcasts, lecture notes, etc.",
        },
      ],
    },
    {
      title: "BROWSE",
      items: [
        {
          title: "By Subject",
        },
        {
          title: "By Departments",
          href: DEPARTMENTS,
        },
        {
          title: "By Provider",
        },
      ],
    },
    {
      title: "DISCOVER LEARNING RESOURCES",
      items: [
        {
          title: "New",
          href: querifiedSearchUrl({
            resource_type: "course",
            sortby: "new",
          }),
        },
        {
          title: "Upcoming",
          href: querifiedSearchUrl({
            resource_type: "course",
            sortby: "upcoming",
          }),
        },
        {
          title: "Popular",
          href: querifiedSearchUrl({
            resource_type: "course",
            sortby: "popular",
          }),
        },
        {
          title: "Free",
          href: querifiedSearchUrl({ free: "true" }),
        },
        {
          title: "With Certificate",
          href: querifiedSearchUrl({ certification: "true" }),
        },
      ],
    },
  ],
}

const Header: FunctionComponent = () => {
  const [drawerOpen, toggleDrawer] = useToggle(false)
  const [searchParams] = useSearchParams()
  const resourceDrawerOpen = searchParams.has(RESOURCE_DRAWER_QUERY_PARAM)
  const { isLoading, data: user } = useUserMe()

  if (isLoading) {
    return null
  }

  const toggler = (event: React.MouseEvent) => {
    if (!resourceDrawerOpen) {
      // This is done to prevent ClickAwayHandler from closing the drawer upon open
      event.stopPropagation()
    }
    toggleDrawer(!drawerOpen)
  }
  const closeDrawer = (event: MouseEvent | TouchEvent) => {
    if (drawerOpen && !resourceDrawerOpen) {
      event.preventDefault()
      toggleDrawer(false)
    }
  }

  return (
    <div>
      <Bar position="fixed">
        <StyledToolbar variant="dense">
          <FlexReverseMobile>
            <LogoLink />
            <LeftDivider orientation="vertical" flexItem />
            <MenuButton text="Explore MIT" onClick={toggler} />
          </FlexReverseMobile>
          <Spacer />
          {user?.is_authenticated ? <LoggedInView /> : <LoggedOutView />}
        </StyledToolbar>
      </Bar>
      <ClickAwayListener onClickAway={closeDrawer}>
        <div role="presentation">
          <NavDrawer
            navdata={navData}
            open={drawerOpen}
            onClose={toggleDrawer.off}
          />
        </div>
      </ClickAwayListener>
    </div>
  )
}

export default Header

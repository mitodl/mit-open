"use client"

import React from "react"
import {
  RiAccountCircleFill,
  RiDashboardLine,
  RiBookmarkLine,
  RiEditLine,
  RiNotificationLine,
} from "@remixicon/react"
import {
  ButtonLink,
  Card,
  Container,
  Skeleton,
  Tab,
  TabButtonLink,
  TabButtonList,
  TabContext,
  TabPanel,
  Tabs,
  Typography,
  styled,
} from "ol-components"
import Link from "next/link"
import { useUserMe } from "api/hooks/user"
import { useParams } from "next/navigation"
import UserListListingComponent from "@/page-components/UserListListing/UserListListing"

import { ProfileEditForm } from "./ProfileEditForm"
import { useProfileMeQuery } from "api/hooks/profile"
import {
  TopPicksCarouselConfig,
  TopicCarouselConfig,
  NEW_LEARNING_RESOURCES_CAROUSEL,
  POPULAR_LEARNING_RESOURCES_CAROUSEL,
  CERTIFICATE_COURSES_CAROUSEL,
  FREE_COURSES_CAROUSEL,
} from "./carousels"
import ResourceCarousel from "@/page-components/ResourceCarousel/ResourceCarousel"
import UserListDetailsTab from "./UserListDetailsTab"
import { SettingsPage } from "./SettingsPage"
import { DASHBOARD_HOME, MY_LISTS, PROFILE, SETTINGS } from "@/common/urls"
import LearningResourceDrawer from "@/page-components/LearningResourceDrawer/LearningResourceDrawer"
// import MetaTags from "@/page-components/MetaTags/MetaTags"

/**
 *
 * The desktop and mobile layouts are significantly different, so we use the
 * `MobileOnly` and `DesktopOnly` components to conditionally render the
 * appropriate layout based on the screen size.
 *
 * **/

const MobileOnly = styled.div(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}))

const DesktopOnly = styled.div(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const Background = styled.div(({ theme }) => ({
  backgroundColor: theme.custom.colors.lightGray1,
  backgroundImage: "url('/static/images/user_menu_background.svg')",
  backgroundAttachment: "fixed",
  backgroundRepeat: "no-repeat",
  height: "100%",
  [theme.breakpoints.down("md")]: {
    backgroundImage: "none",
  },
}))

const Page = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "40px 84px 80px 84px",
  gap: "80px",
  height: "100%",
  [theme.breakpoints.down("md")]: {
    padding: "0",
    gap: "24px",
  },
}))

const DashboardContainer = styled(Container)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    padding: "24px 16px",
    gap: "24px",
  },
}))

const DashboardGrid = styled.div(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "300px minmax(0, 1fr)",
  gap: "48px",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "24px",
  },
}))

const DashboardGridItem = styled.div({
  display: "flex",
  "> *": {
    minWidth: "0px",
  },
})

const ProfileSidebar = styled(Card)(({ theme }) => ({
  position: "fixed",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "300px",
  boxShadow: "-4px 4px 0px 0px #A31F34",
  [theme.breakpoints.down("md")]: {
    position: "relative",
  },
}))

const ProfilePhotoContainer = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  padding: "12px 20px",
  gap: "16px",
  borderBottom: `1px solid ${theme.custom.colors.lightGray2}`,
  background: `linear-gradient(90deg, ${theme.custom.colors.white} 0%, ${theme.custom.colors.lightGray1} 100%)`,
}))

const UserNameContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "8px",
})

const UserIcon = styled(RiAccountCircleFill)(({ theme }) => ({
  width: "64px",
  height: "64px",
  color: theme.custom.colors.black,
}))

const UserNameText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.h5,
}))

const TabsContainer = styled(Tabs)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  textDecoration: "none",
  "& .MuiTabs-indicator": {
    display: "none",
  },
  a: {
    padding: "0",
    opacity: "1",
  },
  "&:hover": {
    a: {
      textDecoration: "none",
    },
  },
  ".user-menu-tab-selected": {
    ".user-menu-link-icon, .user-menu-link-text": {
      color: theme.custom.colors.mitRed,
    },
  },
}))

const TabContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flex: "1 0 0",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "16px 20px",
  gap: "8px",
  width: "300px",
  borderBottom: `1px solid ${theme.custom.colors.lightGray1}`,
  "&:hover": {
    ".user-menu-link-icon, .user-menu-link-text": {
      color: theme.custom.colors.mitRed,
    },
  },
}))

const LinkIconContainer = styled.div(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
}))

const LinkText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body2,
}))

const TabPanelStyled = styled(TabPanel)({
  padding: "0",
  width: "100%",
})

const TitleText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.black,
  paddingBottom: "16px",
  ...theme.typography.h3,
  [theme.breakpoints.down("md")]: {
    ...theme.typography.h5,
  },
}))

const SubTitleText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.darkGray2,
  ...theme.typography.body1,
  [theme.breakpoints.down("md")]: {
    ...theme.typography.subtitle3,
  },
}))

const HomeHeader = styled.div(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  [theme.breakpoints.down("md")]: {
    paddingBottom: "8px",
  },
}))

const HomeHeaderLeft = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  flex: "1 0 0",
})

const HomeHeaderRight = styled.div(({ theme }) => ({
  display: "flex",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}))

const StyledResourceCarousel = styled(ResourceCarousel)(({ theme }) => ({
  padding: "40px 0",
  [theme.breakpoints.down("md")]: {
    padding: "16px 0",
  },
}))

const TabKeys = {
  [DASHBOARD_HOME]: "home",
  [MY_LISTS]: "my-lists",
  [PROFILE]: "profile",
  [SETTINGS]: "settings",
}

const TabLabels = {
  [DASHBOARD_HOME]: "Home",
  [MY_LISTS]: "My Lists",
  [PROFILE]: "Profile",
  [SETTINGS]: "Settings",
}

interface UserMenuTabProps {
  icon: React.ReactNode
  text: string
  tabKey: string
  value: string
  currentValue: string
  onClick?: () => void
}

const UserMenuTab: React.FC<UserMenuTabProps> = (props) => {
  const { icon, text, tabKey, value, currentValue, onClick } = props
  const selected = value === currentValue
  return (
    <Tab
      component={Link}
      href={value}
      data-testid={`desktop-tab-${tabKey}`}
      label={
        <TabContainer
          onClick={onClick}
          className={selected ? "user-menu-tab-selected" : ""}
        >
          <LinkIconContainer className="user-menu-link-icon">
            {icon}
          </LinkIconContainer>
          <LinkText className="user-menu-link-text">{text}</LinkText>
        </TabContainer>
      }
    ></Tab>
  )
}

type RouteParams = {
  id: string
}

const DashboardPage: React.FC = () => {
  const { isLoading: isLoadingUser, data: user } = useUserMe()
  const { isLoading: isLoadingProfile, data: profile } = useProfileMeQuery()
  const params = useParams<{ tab: string }>()

  const appRouterPath = `${DASHBOARD_HOME}${params.tab}/`

  const id = Number(useParams<RouteParams>().id) || -1
  const showUserListDetail = appRouterPath === MY_LISTS && id !== -1

  const tabValue = showUserListDetail
    ? MY_LISTS
    : [DASHBOARD_HOME, MY_LISTS, PROFILE, SETTINGS].includes(appRouterPath)
      ? appRouterPath
      : DASHBOARD_HOME

  const topics = profile?.preference_search_filters.topic
  const certification = profile?.preference_search_filters.certification

  const desktopMenu = (
    <ProfileSidebar>
      <Card.Content>
        <ProfilePhotoContainer>
          <UserIcon />
          <UserNameContainer>
            {isLoadingUser ? (
              <Skeleton variant="text" width={128} height={32} />
            ) : (
              <UserNameText>{`${user?.first_name} ${user?.last_name}`}</UserNameText>
            )}
          </UserNameContainer>
        </ProfilePhotoContainer>
        <TabsContainer
          value={appRouterPath}
          orientation="vertical"
          data-testid="desktop-tab-list"
        >
          <UserMenuTab
            icon={<RiDashboardLine />}
            text={TabLabels[DASHBOARD_HOME]}
            tabKey={TabKeys[DASHBOARD_HOME]}
            value={DASHBOARD_HOME}
            currentValue={tabValue}
          />
          <UserMenuTab
            icon={<RiBookmarkLine />}
            text={TabLabels[MY_LISTS]}
            tabKey={TabKeys[MY_LISTS]}
            value={MY_LISTS}
            currentValue={tabValue}
          />
          <UserMenuTab
            icon={<RiEditLine />}
            text={TabLabels[PROFILE]}
            tabKey={TabKeys[PROFILE]}
            value={PROFILE}
            currentValue={tabValue}
          />
          <UserMenuTab
            icon={<RiNotificationLine />}
            text={TabLabels[SETTINGS]}
            tabKey={TabKeys[SETTINGS]}
            value={SETTINGS}
            currentValue={tabValue}
          />
        </TabsContainer>
      </Card.Content>
    </ProfileSidebar>
  )

  const mobileMenu = (
    <TabButtonList data-testid="mobile-tab-list">
      <TabButtonLink
        data-testid={`mobile-tab-${TabKeys[DASHBOARD_HOME]}`}
        value={DASHBOARD_HOME}
        href={DASHBOARD_HOME}
        label="Home"
      />
      <TabButtonLink
        data-testid={`mobile-tab-${TabKeys[MY_LISTS]}`}
        value={MY_LISTS}
        href={MY_LISTS}
        label="My Lists"
      />
      <TabButtonLink
        data-testid={`mobile-tab-${TabKeys[PROFILE]}`}
        value={PROFILE}
        href={PROFILE}
        label="Profile"
      />
      <TabButtonLink
        data-testid={`mobile-tab-${TabKeys[SETTINGS]}`}
        value={SETTINGS}
        href={SETTINGS}
        label="Settings"
      />
    </TabButtonList>
  )

  return (
    <Background>
      <Page>
        <LearningResourceDrawer />
        <DashboardContainer>
          {/* TODO <MetaTags title="Your MIT Learning Journey" social={false} /> */}
          <TabContext value={tabValue}>
            <DashboardGrid>
              <DashboardGridItem>
                <MobileOnly>{mobileMenu}</MobileOnly>
                <DesktopOnly>{desktopMenu}</DesktopOnly>
              </DashboardGridItem>
              {showUserListDetail ? (
                <DashboardGridItem>
                  <UserListDetailsTab userListId={id} />
                </DashboardGridItem>
              ) : (
                <DashboardGridItem>
                  <TabPanelStyled value={DASHBOARD_HOME}>
                    <HomeHeader>
                      <HomeHeaderLeft>
                        <TitleText role="heading">
                          Your MIT Learning Journey
                        </TitleText>
                        <SubTitleText>
                          A customized course list based on your preferences.
                        </SubTitleText>
                      </HomeHeaderLeft>
                      <HomeHeaderRight>
                        <ButtonLink variant="tertiary" href={PROFILE}>
                          Edit Profile
                        </ButtonLink>
                      </HomeHeaderRight>
                    </HomeHeader>
                    <StyledResourceCarousel
                      title="Top picks for you"
                      isLoading={isLoadingProfile}
                      config={TopPicksCarouselConfig(profile)}
                      data-testid="top-picks-carousel"
                    />
                    {topics?.map((topic, index) => (
                      <StyledResourceCarousel
                        key={index}
                        title={`Popular courses in ${topic}`}
                        isLoading={isLoadingProfile}
                        config={TopicCarouselConfig(topic)}
                        data-testid={`topic-carousel-${topic}`}
                      />
                    ))}
                    {certification === true ? (
                      <StyledResourceCarousel
                        title="Courses with Certificates"
                        isLoading={isLoadingProfile}
                        config={CERTIFICATE_COURSES_CAROUSEL}
                        data-testid="certification-carousel"
                      />
                    ) : (
                      <StyledResourceCarousel
                        title="Free courses"
                        isLoading={isLoadingProfile}
                        config={FREE_COURSES_CAROUSEL}
                        data-testid="free-carousel"
                      />
                    )}
                    <StyledResourceCarousel
                      title="New"
                      config={NEW_LEARNING_RESOURCES_CAROUSEL}
                      data-testid="new-learning-resources-carousel"
                    />
                    <StyledResourceCarousel
                      title="Popular"
                      config={POPULAR_LEARNING_RESOURCES_CAROUSEL}
                      data-testid="popular-learning-resources-carousel"
                    />
                  </TabPanelStyled>
                  <TabPanelStyled value={MY_LISTS}>
                    <UserListListingComponent title="My Lists" />
                  </TabPanelStyled>
                  <TabPanelStyled value={PROFILE}>
                    <TitleText role="heading">Profile</TitleText>
                    {isLoadingProfile || !profile ? (
                      <Skeleton variant="text" width={128} height={32} />
                    ) : (
                      <div id="user-profile-edit">
                        <ProfileEditForm profile={profile} />
                      </div>
                    )}
                  </TabPanelStyled>
                  <TabPanelStyled value={SETTINGS}>
                    <TitleText role="heading">Settings</TitleText>
                    {isLoadingProfile || !profile ? (
                      <Skeleton variant="text" width={128} height={32} />
                    ) : (
                      <div id="user-settings">
                        <SettingsPage />
                      </div>
                    )}
                  </TabPanelStyled>
                </DashboardGridItem>
              )}
            </DashboardGrid>
          </TabContext>
        </DashboardContainer>
      </Page>
    </Background>
  )
}

export default DashboardPage

export { TabKeys as DashboardTabKeys, TabLabels as DashboardTabLabels }

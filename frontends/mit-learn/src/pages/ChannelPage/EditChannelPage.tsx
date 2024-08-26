import React, { useCallback } from "react"
// import { useNavigate, useLocation, useParams } from "react-router"
import { useRouter, useLocation, useParams } from "next/navigation"
import Link from "next/link"
import { Container, TabList, Tab, TabContext, TabPanel } from "ol-components"

// import { MetaTags } from "ol-utilities"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import { useChannelDetail } from "api/hooks/channels"
import EditChannelAppearanceForm from "./EditChannelAppearanceForm"
import { ChannelPageTemplate } from "./ChannelPageTemplate"
import MetaTags from "@/page-components/MetaTags/MetaTags"
type RouteParams = {
  channelType: string
  name: string
}

const keyFromHash = (hash: string) => {
  const keys = ["appearance", "moderators"]
  const match = keys.find((key) => `#${key}` === hash)
  return match ?? "appearance"
}

const EditChannelPage: React.FC = () => {
  const { channelType, name } = useParams<RouteParams>()
  const router = useRouter()
  const { hash } = useLocation()
  const tabValue = keyFromHash(hash)
  const channel = useChannelDetail(String(channelType), String(name))

  const handleChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      router.push({ hash: newValue }, { replace: true })
    },
    [navigate],
  )

  return channel.data ? (
    <ChannelPageTemplate
      name={channel.data?.name}
      channelType={channel.data?.channel_type}
    >
      {/* TODO <MetaTags title={`Editing | ${channel.data.title}`} social={false} /> */}
      {channel.data.is_moderator ? (
        <TabContext value={tabValue}>
          <div className="page-subbanner">
            <Container className="page-nav-container">
              <GridContainer>
                <GridColumn variant="main-2">
                  <TabList className="page-nav" onChange={handleChange}>
                    <Tab
                      component={Link}
                      to="#appearance"
                      label="Appearance"
                      value="appearance"
                    />
                    <Tab
                      component={Link}
                      to="#moderators"
                      label="Moderators"
                      value="moderators"
                    />
                  </TabList>
                </GridColumn>
              </GridContainer>
            </Container>
          </div>
          <Container>
            <GridContainer className="edit-channel">
              <GridColumn variant="main-2">
                <TabPanel value="appearance" className="page-nav-content">
                  <div>
                    <EditChannelAppearanceForm channel={channel.data} />
                  </div>
                </TabPanel>
                <TabPanel value="moderators" className="page-nav-content">
                  Moderators placeholder
                </TabPanel>
              </GridColumn>
            </GridContainer>
          </Container>
        </TabContext>
      ) : (
        <Container>
          <GridContainer>
            <GridColumn variant="main-2">
              <div className="row">
                You do not have permission to access this page.
              </div>
            </GridColumn>
          </GridContainer>
        </Container>
      )}
    </ChannelPageTemplate>
  ) : null
}

export default EditChannelPage

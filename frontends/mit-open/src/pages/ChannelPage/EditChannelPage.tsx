import React, { useCallback } from "react"
import { useNavigate, useLocation, useParams } from "react-router"
import { Link } from "react-router-dom"
import { Container, TabList, Tab, TabContext, TabPanel } from "ol-components"

import { MetaTags } from "ol-utilities"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import { useChannelDetail } from "api/hooks/channels"
import EditChannelAppearanceForm from "./EditChannelAppearanceForm"
import ChannelPageSkeleton from "./ChannelPageSkeleton"
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
  const navigate = useNavigate()
  const { hash } = useLocation()
  const tabValue = keyFromHash(hash)
  const channel = useChannelDetail(String(channelType), String(name))
  const handleChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      navigate({ hash: newValue }, { replace: true })
    },
    [navigate],
  )

  return channel.data ? (
    <ChannelPageSkeleton
      name={channel.data?.name}
      channelType={channel.data?.channel_type}
    >
      <MetaTags title={[channel.data.title, "Edit"]} />
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
    </ChannelPageSkeleton>
  ) : null
}

export default EditChannelPage

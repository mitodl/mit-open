import React, { useCallback } from "react"
import { useParams, useLocation, useNavigate } from "react-router"
import { Tab, TabContext, TabList, TabPanel, Container } from "ol-components"
import { Link } from "react-router-dom"
import FieldPageSkeleton from "./ChannelPageSkeleton"
import { useChannelDetailByType } from "../../../../api/src/hooks/channels"
import WidgetsList from "./WidgetsList"
import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import { makeFieldViewPath } from "@/common/urls"

type RouteParams = {
  channelType: string
  name: string
}

const keyFromHash = (hash: string) => {
  const keys = ["home", "about"]
  const match = keys.find((key) => `#${key}` === hash)
  return match ?? "home"
}

const MANAGE_WIDGETS_SUFFIX = "manage/widgets"

const ChannelPage: React.FC = () => {
  const { channelType, name } = useParams<RouteParams>()
  const navigate = useNavigate()
  const { hash, pathname } = useLocation()
  const fieldQuery = useChannelDetailByType(channelType || "", name || "")
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      navigate({ hash: newValue }, { replace: true })
    },
    [navigate],
  )

  const isEditingWidgets = pathname
    .replace(/\/$/, "")
    .endsWith(MANAGE_WIDGETS_SUFFIX)
  const tabValue = keyFromHash(hash)

  const leaveWidgetManagement = useCallback(() => {
    navigate(makeFieldViewPath(channelType, name))
  }, [navigate, channelType, name])

  return (
    <FieldPageSkeleton name={name} channelType={channelType}>
      <TabContext value={tabValue}>
        <div>
          <Container>
            <GridContainer>
              <GridColumn variant="main-2-wide-main">
                <TabList onChange={handleChange}>
                  <Tab component={Link} to="#" label="Home" value="home" />
                  <Tab
                    component={Link}
                    to="#about"
                    label="About"
                    value="about"
                  />
                </TabList>
              </GridColumn>
              <GridColumn variant="sidebar-2-wide-main" />
            </GridContainer>
          </Container>
        </div>
        <Container>
          <GridContainer>
            <GridColumn variant="main-2-wide-main">
              <TabPanel value="home">
                <p>{fieldQuery.data?.public_description}</p>
              </TabPanel>
              <TabPanel value="about"></TabPanel>
            </GridColumn>
            <GridColumn variant="sidebar-2-wide-main">
              {fieldQuery.data?.widget_list && (
                <WidgetsList
                  widgetListId={fieldQuery.data.widget_list}
                  isEditing={isEditingWidgets}
                  onFinishEditing={leaveWidgetManagement}
                />
              )}
            </GridColumn>
          </GridContainer>
        </Container>
      </TabContext>
    </FieldPageSkeleton>
  )
}

export default ChannelPage

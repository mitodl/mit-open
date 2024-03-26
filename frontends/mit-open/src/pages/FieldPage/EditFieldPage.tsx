import React, { useCallback } from "react"
import { useNavigate, useLocation, useParams } from "react-router"
import { Link } from "react-router-dom"
import { Container, TabList, Tab, TabContext, TabPanel } from "ol-components"

import { MetaTags } from "ol-utilities"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"
import { useFieldDetail } from "api/hooks/fields"
import EditFieldAppearanceForm from "./EditFieldAppearanceForm"
import FieldPageSkeleton from "./FieldPageSkeleton"
type RouteParams = {
  name: string
}

const keyFromHash = (hash: string) => {
  const keys = ["appearance", "moderators"]
  const match = keys.find((key) => `#${key}` === hash)
  return match ?? "appearance"
}

const EditFieldPage: React.FC = () => {
  const { name } = useParams<RouteParams>()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const tabValue = keyFromHash(hash)
  const field = useFieldDetail(name)
  const handleChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      navigate({ hash: newValue }, { replace: true })
    },
    [navigate],
  )

  return field.data ? (
    <FieldPageSkeleton name={name || ""}>
      <MetaTags>
        <title>Edit {field.data.title} Channel</title>
      </MetaTags>
      {field.data.is_moderator ? (
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
                    <EditFieldAppearanceForm field={field.data} />
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
    </FieldPageSkeleton>
  ) : null
}

export default EditFieldPage

import React, { useCallback, useMemo } from "react"
import { useParams, useLocation, useNavigate } from "react-router"

import {
  Container,
  useMuiBreakpointAtLeast,
  Tab,
  TabContext,
  TabList,
  TabPanel,
  TitledCarousel,
} from "ol-design"
import type { UserList } from "ol-search-ui"
import { Link } from "react-router-dom"
import FieldPageSkeleton from "./FieldPageSkeleton"
import ArrowForward from "@mui/icons-material/ArrowForward"
import ArrowBack from "@mui/icons-material/ArrowBack"
import { useFieldDetails } from "services/api/fields"
import { useUserListItems } from "services/api/learning-resources"
import WidgetsList from "../components/WidgetsList"
import { GridColumn, GridContainer } from "components/GridLayout/GridLayout"
import LearningResourceCard from "page-components/LearningResourceCard/LearningResourceCard"
import invariant from "tiny-invariant"

type RouteParams = {
  name: string
}

const keyFromHash = (hash: string) => {
  const keys = ["home", "about"]
  const match = keys.find((key) => `#${key}` === hash)
  return match ?? "home"
}
interface FieldListProps {
  list: UserList
}

const FieldList: React.FC<FieldListProps> = ({ list }) => {
  const itemsQuery = useUserListItems(list.id)
  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages ?? []
    return pages.flatMap((p) => p.results.map((r) => r.content_data)) ?? []
  }, [itemsQuery.data?.pages])
  return (
    <section>
      <h3>{list.title}</h3>
      <ul className="ic-card-row-list">
        {items.map((item) => (
          <li key={item.id}>
            <LearningResourceCard variant="row-reverse" resource={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

const FieldCarousel: React.FC<FieldListProps> = ({ list }) => {
  const itemsQuery = useUserListItems(list.id)
  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages ?? []
    return pages.flatMap((p) => p.results.map((r) => r.content_data)) ?? []
  }, [itemsQuery.data?.pages])
  const isSm = useMuiBreakpointAtLeast("sm")
  const isLg = useMuiBreakpointAtLeast("lg")
  const pageSize = isLg ? 3 : isSm ? 2 : 1
  return (
    <TitledCarousel
      as="section"
      carouselClassName="ic-carousel"
      headerClassName="ic-carousel-header"
      pageSize={pageSize}
      cellSpacing={0} // we'll handle it with css
      title={<h3>{list.title}</h3>}
      previous={
        <button
          type="button"
          className="ic-carousel-button-prev outlined-button"
        >
          <ArrowBack fontSize="inherit" /> Previous
        </button>
      }
      next={
        <button
          type="button"
          className="ic-carousel-button-next outlined-button"
        >
          Next <ArrowForward fontSize="inherit" />
        </button>
      }
    >
      {items.map((item) => (
        <LearningResourceCard
          key={item.id}
          className="ic-resource-card ic-carousel-card"
          resource={item}
          variant="column"
        />
      ))}
    </TitledCarousel>
  )
}

const MANAGE_WIDGETS_SUFFIX = "manage/widgets/"

const FieldPage: React.FC = () => {
  const { name } = useParams<RouteParams>()
  invariant(name, "Route parameter should be defined")
  const navigate = useNavigate()
  const { hash, pathname } = useLocation()
  const tabValue = keyFromHash(hash)
  const fieldQuery = useFieldDetails(name)
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      navigate({ hash: newValue }, { replace: true })
    },
    [navigate],
  )

  const featuredList = fieldQuery.data?.featured_list
  const fieldLists = fieldQuery.data?.lists ?? []
  const isEditingWidgets = pathname.endsWith(MANAGE_WIDGETS_SUFFIX)

  const leaveWidgetManagement = useCallback(() => {
    navigate(
      {
        pathname: pathname.slice(0, -MANAGE_WIDGETS_SUFFIX.length),
      },
      { replace: true },
    )
  }, [navigate, pathname])

  return (
    <FieldPageSkeleton name={name}>
      <TabContext value={tabValue}>
        <div className="page-subbanner">
          <Container>
            <GridContainer>
              <GridColumn variant="main-2-wide-main">
                <TabList className="page-nav" onChange={handleChange}>
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
              <TabPanel value="home" className="page-nav-content">
                <p>{fieldQuery.data?.public_description}</p>
                {featuredList && <FieldCarousel list={featuredList} />}
                {fieldLists.map((list) => (
                  <FieldList key={list.id} list={list} />
                ))}
              </TabPanel>
              <TabPanel value="about" className="page-nav-content"></TabPanel>
            </GridColumn>
            <GridColumn variant="sidebar-2-wide-main">
              {fieldQuery.data?.widget_list && (
                <WidgetsList
                  className="ic-widget-list"
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

export default FieldPage

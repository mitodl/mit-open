import React, { useCallback, useMemo } from "react"
import { useHistory } from "react-router"
import { Button, SimpleMenu, IconButton } from "ol-design"
import type { SimpleMenuItemConfig } from "ol-design"
import { Grid, LoadingSpinner } from "ol-design"
import EditIcon from "@mui/icons-material/Edit"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import DeleteIcon from "@mui/icons-material/Delete"
import { Container } from "ol-design"

import { BannerPage, MetaTags } from "ol-util"
import type { LearningPathResource } from "api"
import { useLearningPathsList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "../../components/layout"

import { LearningResourceCardTemplate } from "ol-learning-resources"

import { imgConfigs } from "../../util/constants"
import { manageListDialogs } from "./ManageListDialogs"

import * as urls from "../urls"

type EditListMenuProps = {
  resource: LearningPathResource
}

const EDIT_MENU_ITEMS: SimpleMenuItemConfig<"edit" | "delete">[] = [
  {
    key: "edit",
    label: "Edit",
    icon: <EditIcon />,
  },
  {
    key: "delete",
    label: "Delete",
    icon: <DeleteIcon />,
  },
]

const EditListMenu: React.FC<EditListMenuProps> = ({ resource }) => {
  const actionsOrLinks = useMemo(
    () => ({
      delete: () => manageListDialogs.destroy(resource),
      edit: () => manageListDialogs.upsert(resource),
    }),
    [resource],
  )
  return (
    <SimpleMenu
      trigger={
        <IconButton size="small" aria-label={`Edit list ${resource.title}`}>
          <MoreVertIcon fontSize="inherit" />
        </IconButton>
      }
      items={EDIT_MENU_ITEMS}
      actionsOrLinks={actionsOrLinks}
    />
  )
}

type ListCardProps = {
  list: LearningPathResource
  onActivate: (resource: LearningPathResource) => void
  canEdit: boolean
}
const ListCard: React.FC<ListCardProps> = ({ list, onActivate, canEdit }) => {
  return (
    <LearningResourceCardTemplate
      variant="row-reverse"
      className="ic-resource-card"
      resource={list}
      imgConfig={imgConfigs["row-reverse-small"]}
      footerActionSlot={canEdit ? <EditListMenu resource={list} /> : null}
      onActivate={onActivate}
    />
  )
}

const LearningPathListingPage: React.FC = () => {
  const listingQuery = useLearningPathsList()

  const history = useHistory()
  const handleActivate = useCallback(
    (resource: LearningPathResource) => {
      const path = urls.learningPathsView(resource.id)
      history.push(path)
    },
    [history],
  )
  const handleCreate = useCallback(() => {
    manageListDialogs.upsert()
  }, [])

  const canEdit = window.SETTINGS.user.is_learning_path_editor

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      compactOnMobile
      className="learningpaths-page"
    >
      <MetaTags>
        <title>Learning Paths</title>
      </MetaTags>
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full">
            <Grid container className="list-header">
              <Grid item xs={6}>
                <h1>Learning Paths</h1>
              </Grid>
              <Grid item xs={6} className="ic-centered-right">
                {canEdit ? (
                  <Button variant="contained" onClick={handleCreate}>
                    Create new list
                  </Button>
                ) : null}
              </Grid>
            </Grid>
            <section>
              <LoadingSpinner loading={listingQuery.isLoading} />
              {listingQuery.data && (
                <ul className="ic-card-row-list">
                  {listingQuery.data.results?.map((list) => {
                    return (
                      <li key={list.id}>
                        <ListCard
                          list={list}
                          onActivate={handleActivate}
                          canEdit={canEdit}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default LearningPathListingPage

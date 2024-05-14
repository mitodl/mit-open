import React, { useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import {
  Button,
  SimpleMenu,
  IconButton,
  Grid,
  LoadingSpinner,
  BannerPage,
  Container,
  styled,
  Typography,
  PlainList,
} from "ol-components"
import type { SimpleMenuItem } from "ol-components"
import EditIcon from "@mui/icons-material/Edit"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import DeleteIcon from "@mui/icons-material/Delete"

import { MetaTags } from "ol-utilities"
import type { LearningPathResource } from "api"
import { useLearningPathsList } from "api/hooks/learningResources"

import { GridColumn, GridContainer } from "@/components/GridLayout/GridLayout"

import LearningResourceCardTemplate from "@/page-components/LearningResourceCardTemplate/LearningResourceCardTemplate"

import { imgConfigs } from "@/common/constants"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import * as urls from "@/common/urls"
import { useUserMe } from "api/hooks/user"

const ListHeaderGrid = styled(Grid)`
  margin-top: 1rem;
  margin-bottom: 1rem;
`

type EditListMenuProps = {
  resource: LearningPathResource
}

const EditListMenu: React.FC<EditListMenuProps> = ({ resource }) => {
  const items: SimpleMenuItem[] = useMemo(
    () => [
      {
        key: "edit",
        label: "Edit",
        icon: <EditIcon />,
        onClick: () => manageListDialogs.upsertLearningPath(resource),
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteIcon />,
        onClick: () => manageListDialogs.destroyLearningPath(resource),
      },
    ],
    [resource],
  )
  return (
    <SimpleMenu
      trigger={
        <IconButton
          variant="text"
          color="secondary"
          size="small"
          aria-label={`Edit list ${resource.title}`}
        >
          <MoreVertIcon fontSize="inherit" />
        </IconButton>
      }
      items={items}
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
      resource={list}
      imgConfig={imgConfigs["row-reverse-small"]}
      footerActionSlot={canEdit ? <EditListMenu resource={list} /> : null}
      onActivate={onActivate}
    />
  )
}

const LearningPathListingPage: React.FC = () => {
  const listingQuery = useLearningPathsList()
  const { data: user } = useUserMe()

  const navigate = useNavigate()
  const handleActivate = useCallback(
    (resource: LearningPathResource) => {
      const path = urls.learningPathsView(resource.id)
      navigate(path)
    },
    [navigate],
  )
  const handleCreate = useCallback(() => {
    manageListDialogs.upsertLearningPath()
  }, [])

  const canEdit = !!user?.is_learning_path_editor

  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      alt=""
      className="learningpaths-page"
    >
      <MetaTags>
        <title>Learning Paths</title>
      </MetaTags>
      <Container maxWidth="sm">
        <GridContainer>
          <GridColumn variant="single-full">
            <ListHeaderGrid container justifyContent="space-between">
              <Grid item>
                <Typography variant="h3" component="h1">
                  Learning Paths
                </Typography>
              </Grid>
              <Grid
                item
                justifyContent="flex-end"
                alignItems="center"
                display="flex"
              >
                {canEdit ? (
                  <Button variant="filled" onClick={handleCreate}>
                    Create new list
                  </Button>
                ) : null}
              </Grid>
            </ListHeaderGrid>
            <section>
              <LoadingSpinner loading={listingQuery.isLoading} />
              {listingQuery.data && (
                <PlainList itemSpacing={3}>
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
                </PlainList>
              )}
            </section>
          </GridColumn>
        </GridContainer>
      </Container>
    </BannerPage>
  )
}

export default LearningPathListingPage

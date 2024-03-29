import React, { useMemo } from "react"

import { useParams } from "react-router"

import {
  useInfiniteLearningPathItems,
  useLearningPathsDetail,
} from "api/hooks/learningResources"

import ListDetailsPage from "./ListDetailsPage"
import { LearningResourceListItem } from "./ItemsListing"
import { manageLearningPathDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import { LIST_TYPE_LEARNING_PATH } from "../../../../api/src/common/constants"

type RouteParams = {
  id: string
}

const LearningPathDetailsPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const pathQuery = useLearningPathsDetail(id)
  const itemsQuery = useInfiniteLearningPathItems({ learning_resource_id: id })
  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return (
      pages?.flatMap(
        (p) => (p.results as unknown as LearningResourceListItem) ?? [],
      ) ?? []
    )
  }, [itemsQuery.data])

  return (
    <ListDetailsPage
      listType={LIST_TYPE_LEARNING_PATH}
      title={pathQuery?.data?.title}
      description={pathQuery.data?.description}
      items={items}
      isLoading={itemsQuery.isLoading}
      isFetching={itemsQuery.isFetching}
      handleEdit={() => manageLearningPathDialogs.upsert(pathQuery.data)}
    />
  )
}

export default LearningPathDetailsPage

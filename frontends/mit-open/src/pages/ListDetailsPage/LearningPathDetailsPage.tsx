import React, { useMemo } from "react"

import { useParams } from "react-router"

import {
  useInfiniteLearningPathItems,
  useLearningPathsDetail,
} from "api/hooks/learningResources"

import { ListDetailsPage } from "./ListDetailsPage"
import { manageListDialogs } from "@/page-components/ManageListDialogs/ManageListDialogs"
import { ListType } from "api/constants"

type RouteParams = {
  id: string
}

const LearningPathDetailsPage: React.FC = () => {
  const id = Number(useParams<RouteParams>().id)
  const pathQuery = useLearningPathsDetail(id)
  const itemsQuery = useInfiniteLearningPathItems({
    learning_resource_id: id,
    limit: 100,
  })
  const items = useMemo(() => {
    const pages = itemsQuery.data?.pages
    return pages?.flatMap((p) => p.results ?? []) ?? []
  }, [itemsQuery.data])
  const list = useMemo(() => {
    if (!pathQuery.data) {
      return undefined
    }
    return {
      title: pathQuery.data.title,
      description: pathQuery.data.description,
      item_count: pathQuery.data.learning_path.item_count,
    }
  }, [pathQuery.data])

  return (
    <ListDetailsPage
      listType={ListType.LearningPath}
      list={list}
      items={items}
      isLoading={itemsQuery.isLoading}
      isFetching={itemsQuery.isFetching}
      handleEdit={() => manageListDialogs.upsertLearningPath(pathQuery.data)}
    />
  )
}

export default LearningPathDetailsPage

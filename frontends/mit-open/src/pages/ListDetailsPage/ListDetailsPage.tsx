import React from "react"
import { Container, BannerPage } from "ol-components"
import { MetaTags } from "ol-utilities"
import ItemsListingComponent from "@/page-components/ItemsListing/ItemsListingComponent"
import type { ItemsListingComponentProps } from "@/page-components/ItemsListing/ItemsListingComponent"

const ListDetailsPage: React.FC<ItemsListingComponentProps> = ({
  listType,
  list,
  items,
  showSort,
  canEdit,
  isLoading,
  isFetching,
  handleEdit,
}) => {
  return (
    <BannerPage
      src="/static/images/course_search_banner.png"
      className="learningpaths-page"
    >
      <MetaTags title={list?.title} />
      <Container maxWidth="md">
        <ItemsListingComponent
          listType={listType}
          list={list}
          items={items}
          showSort={showSort}
          canEdit={canEdit}
          isLoading={isLoading}
          isFetching={isFetching}
          handleEdit={handleEdit}
        />
      </Container>
    </BannerPage>
  )
}

export { ListDetailsPage }

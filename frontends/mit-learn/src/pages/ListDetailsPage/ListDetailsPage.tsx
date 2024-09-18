import React from "react"
import { Container, BannerPage, styled } from "ol-components"
import MetaTags from "@/page-components/MetaTags/MetaTags"
import ItemsListingComponent from "@/page-components/ItemsListing/ItemsListingComponent"
import type { ItemsListingComponentProps } from "@/page-components/ItemsListing/ItemsListingComponent"

const StyledContainer = styled(Container)({
  paddingTop: "24px",
})

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
      <MetaTags title={list?.title} social={false} />
      <StyledContainer maxWidth="md">
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
      </StyledContainer>
    </BannerPage>
  )
}

export { ListDetailsPage }

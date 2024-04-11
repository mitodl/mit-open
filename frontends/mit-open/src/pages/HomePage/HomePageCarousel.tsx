import React from "react"
import { UseQueryResult } from "@tanstack/react-query"
import { Carousel, useMuiBreakpointAtLeast, styled } from "ol-components"
import type { PaginatedLearningResourceList } from "api"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"

interface HomePageCarouselProps {
  query: UseQueryResult<PaginatedLearningResourceList>
  showNavigationButtons?: boolean
}

const CarouselCard = styled(LearningResourceCard)({
  height: "100%",
})

const HomePageCarousel: React.FC<HomePageCarouselProps> = ({ query }) => {
  const aboveSm = useMuiBreakpointAtLeast("sm")
  const aboveLg = useMuiBreakpointAtLeast("lg")
  const pageSize = aboveLg ? 4 : aboveSm ? 2 : 1

  return (
    <Carousel
      as="section"
      pageSize={pageSize}
      cellSpacing={0} // we'll handle it with css
    >
      {query.data?.results?.map((resource) => (
        <CarouselCard key={resource.id} resource={resource} variant="column" />
      ))}
    </Carousel>
  )
}

export default HomePageCarousel

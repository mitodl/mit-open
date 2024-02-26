import React from "react"
import { UseQueryResult } from "@tanstack/react-query"
import ArrowBack from "@mui/icons-material/ArrowBack"
import ArrowForward from "@mui/icons-material/ArrowForward"
import {
  Button,
  TitledCarousel,
  useMuiBreakpointAtLeast,
  styled,
} from "ol-components"
import type { PaginatedLearningResourceList } from "api"
import LearningResourceCard from "@/page-components/LearningResourceCard/LearningResourceCard"

interface HomePageCarouselProps {
  query: UseQueryResult<PaginatedLearningResourceList>
  showNavigationButtons?: boolean
  title: React.ReactNode
}

const CAROUSEL_SPACING = 24

const CarouselCard = styled(LearningResourceCard)({
  height: "100%",
  marginLeft: CAROUSEL_SPACING * 0.5,
  marginRight: CAROUSEL_SPACING * 0.5,
})

const CarouselButton = styled(Button)({
  padding: 10,
  paddingLeft: 15,
  paddingRight: 15,
  marginRight: "0.5em",
  marginLeft: "0.5em",
})

const HomePageCarousel: React.FC<HomePageCarouselProps> = ({
  query,
  showNavigationButtons = true,
  title,
}) => {
  const aboveSm = useMuiBreakpointAtLeast("sm")
  const aboveLg = useMuiBreakpointAtLeast("lg")
  const pageSize = aboveLg ? 4 : aboveSm ? 2 : 1

  return (
    <TitledCarousel
      title={title}
      as="section"
      pageSize={pageSize}
      cellSpacing={0} // we'll handle it with css
      previous={
        <CarouselButton
          variant="outlined"
          color="secondary"
          startIcon={<ArrowBack fontSize="inherit" />}
        >
          Previous
        </CarouselButton>
      }
      next={
        <CarouselButton
          variant="outlined"
          color="secondary"
          endIcon={<ArrowForward fontSize="inherit" />}
        >
          Next
        </CarouselButton>
      }
      showNavigationButtons={showNavigationButtons}
    >
      {query.data?.results?.map((resource) => (
        <CarouselCard key={resource.id} resource={resource} variant="column" />
      ))}
    </TitledCarousel>
  )
}

export default HomePageCarousel

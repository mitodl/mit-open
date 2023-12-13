import React from "react"
import { UseQueryResult } from "@tanstack/react-query"
import ArrowBack from "@mui/icons-material/ArrowBack"
import ArrowForward from "@mui/icons-material/ArrowForward"
import {
  Button,
  TitledCarousel,
  useMuiBreakpointAtLeast,
  styled,
} from "ol-design"
import type { PaginatedLearningResourceList } from "api"
import LearningResourceCard from "../../components/LearningResourceCard"

interface HomePageCarouselProps {
  query: UseQueryResult<PaginatedLearningResourceList>
  showNavigationButtons?: boolean
  title: React.ReactNode
}

const CarouselButton = styled(Button)`
  padding: 10px;
  padding-left: 15px;
  padding-right: 15px;
  margin-right: 0.5em;
  margin-left: 0.5em;
`

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
      carouselClassName="ic-carousel"
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
        <LearningResourceCard
          key={resource.id}
          className="ic-resource-card ic-carousel-card"
          resource={resource}
          variant="column"
        />
      ))}
    </TitledCarousel>
  )
}

export default HomePageCarousel

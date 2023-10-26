import React, { useCallback, useState } from "react"
import { SearchInput, SearchInputProps } from "ol-search-ui"
import Container from "@mui/material/Container"
import { Button } from "ol-design"
import { ChipLink } from "ol-design"
import Grid from "@mui/material/Grid"
import { GridContainer } from "../components/layout"
import { TitledCarousel, useMuiBreakpoint } from "ol-util"
import ArrowBack from "@mui/icons-material/ArrowBack"
import ArrowForward from "@mui/icons-material/ArrowForward"
import LearningResourceCard from "../components/LearningResourceCard"
import type { PaginatedLearningResourceList } from "api"
import { useLearningResourcesList } from "api/hooks/learningResources"
import { UseQueryResult } from "@tanstack/react-query"

interface HomePageCarouselProps {
  query: UseQueryResult<PaginatedLearningResourceList>
  showNavigationButtons?: boolean
  title: React.ReactNode
}

const HomePageCarousel: React.FC<HomePageCarouselProps> = ({
  query,
  showNavigationButtons = true,
  title,
}) => {
  const aboveSm = useMuiBreakpoint("sm")
  const aboveLg = useMuiBreakpoint("lg")
  const pageSize = aboveLg ? 4 : aboveSm ? 2 : 1

  return (
    <TitledCarousel
      title={title}
      as="section"
      pageSize={pageSize}
      carouselClassName="ic-carousel"
      cellSpacing={0} // we'll handle it with css
      previous={
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ArrowBack fontSize="inherit" />}
          className="ic-carousel-button-prev"
        >
          Previous
        </Button>
      }
      next={
        <Button
          variant="outlined"
          color="secondary"
          endIcon={<ArrowForward fontSize="inherit" />}
          className="ic-carousel-button-next"
        >
          Next
        </Button>
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

const EXPLORE_BUTTONS = [
  {
    label: "Courses",
  },
  {
    label: "Videos",
  },
  {
    label: "Podcasts",
  },
  {
    label: "Learning Paths",
  },
  {
    label: "By Department",
  },
  {
    label: "By Subject",
  },
  {
    label: "From OCW",
  },
  {
    label: "From MITx",
  },
  {
    label: "With Certificate",
  },
  {
    label: "Micromasters",
  },
  {
    label: "Professional Education",
  },
]

const HomePage: React.FC = () => {
  const [searchText, setSearchText] = useState("")
  const onSearchClear = useCallback(() => setSearchText(""), [])
  const onSearchChange: SearchInputProps["onChange"] = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])
  const onSearchSubmit: SearchInputProps["onSubmit"] = useCallback((e) => {
    console.log("Submitting search")
    console.log(e)
  }, [])
  const resourcesQuery = useLearningResourcesList()

  return (
    <Container className="homepage">
      <GridContainer className="top-container">
        <div className="background-gradient"></div>
        <Grid item xs={12} md={7}>
          <h1 className="page-title">Learn from MIT</h1>
          <h2 className="page-subtitle">
            Search for MIT courses, videos, podcasts, learning paths, and
            communities
          </h2>
          <SearchInput
            value={searchText}
            placeholder="What do you want to learn?"
            onSubmit={onSearchSubmit}
            onClear={onSearchClear}
            onChange={onSearchChange}
            className="homepage-search main-search"
          />
          <div>
            <h3 className="search-buttons-container-label">Explore</h3>
            <div className="search-buttons-container">
              {EXPLORE_BUTTONS.map(({ label }) => (
                <ChipLink
                  className="homepage-explore-chip"
                  color="secondary"
                  to=""
                  key={label}
                  label={label}
                />
              ))}
            </div>
          </div>
        </Grid>
        <Grid item xs={12} md={5}>
          <div>
            <img
              className="frontpage-image-decoration"
              alt="Photos from the MIT campus arranged to form the letter M"
              src="/static/images/infinite-front-page-image.png"
            />
          </div>
        </Grid>
      </GridContainer>
      <HomePageCarousel
        title={<h2>Upcoming Courses</h2>}
        query={resourcesQuery}
      />
    </Container>
  )
}

export default HomePage

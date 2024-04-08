import React, { useCallback, useState } from "react"
import {
  styled,
  ChipLink,
  Container,
  Grid,
  SearchInput,
  theme,
} from "ol-components"
import type { SearchInputProps } from "ol-components"
import { GridContainer } from "@/components/GridLayout/GridLayout"
import { useNavigate } from "react-router"
import TabbedCarousel, {
  TabbedCarouselProps,
} from "@/page-components/TabbedCarousel/TabbedCarousel"

const UPCOMING_COURSES_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 4,
    data: {
      type: "resources_upcoming",
      params: { resource_type: ["course"], limit: 12 },
    },
  },
  {
    label: "Professional",
    pageSize: 4,
    data: {
      type: "resources_upcoming",
      params: { professional: true, resource_type: ["course"], limit: 12 },
    },
  },
]

const MEDIA_CAROUSEL: TabbedCarouselProps["config"] = [
  {
    label: "All",
    pageSize: 6,
    data: {
      type: "resources",
      params: { resource_type: ["video", "podcast"], limit: 12 },
    },
  },
  {
    label: "Videos",
    pageSize: 6,
    data: {
      type: "resources",
      params: { resource_type: ["video"], limit: 12 },
    },
  },
  {
    label: "Podcasts",
    pageSize: 6,
    data: {
      type: "resources",
      params: { resource_type: ["podcast"], limit: 12 },
    },
  },
]

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

const HomePageContainer = styled(Container)`
  margin-bottom: 3.5rem;

  h3 {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
  }
`

const TopContainer = styled(GridContainer)`
  margin-top: 3.5rem;
  margin-bottom: 3.5rem;
`

const BackgroundGradient = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: -100;
  height: 615px;
  background-image: ${({ theme }) =>
    `linear-gradient(${theme.custom.colorBlue1}, ${theme.custom.colorGray1})`};
  width: 100%;
`

const PageTitle = styled.h1`
  margin-bottom: 0.5rem;
  font-size: 50px;
  color: ${({ theme }) => theme.custom.colorBlue5};
`

const StyledSearchInput = styled(SearchInput)`
  margin-top: 1.75rem;
  margin-bottom: 1.75rem;
  background-color: ${({ theme }) => theme.custom.colorBackgroundLight};

  &.MuiInputBase-root {
    max-width: 520px;
    width: 100%;
    border-radius: 3px;
    font-size: 1.25rem;

    fieldset {
      border: 2px solid ${({ theme }) => theme.custom.colorGray4};
    }

    &.Mui-focused fieldset {
      border-color: ${({ theme }) => theme.custom.colorBlue5};
    }

    &.Mui-focused .MuiSvgIcon-root {
      color: ${({ theme }) => theme.custom.colorBlue5};
    }
  }

  .MuiInputBase-input {
    &::placeholder {
      font-size: 1rem;
    }
  }

  .MuiButton-root {
    border-radius: 3px;
    padding: 10px;
  }
`

const SearchButtonsContainer = styled.div`
  max-width: 520px;
`

const StyledChipLink = styled(ChipLink)`
  margin: 8px 16px 8px 0;
`

const FrontPageImage = styled.img`
  height: 435px;
  ${theme.breakpoints.down("md")} {
    display: none;
  }
`

const HomePage: React.FC = () => {
  const [searchText, setSearchText] = useState("")
  const onSearchClear = useCallback(() => setSearchText(""), [])
  const navigate = useNavigate()
  const onSearchChange: SearchInputProps["onChange"] = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])
  const onSearchSubmit: SearchInputProps["onSubmit"] = useCallback(
    (e) => {
      navigate({
        pathname: "/search",
        search: `q=${e.target.value}`,
      })
    },
    [navigate],
  )

  return (
    <HomePageContainer className="homepage">
      <TopContainer>
        <BackgroundGradient />
        <Grid item xs={12} md={7}>
          <PageTitle>Learn from MIT</PageTitle>
          <h2>
            Search for MIT courses, videos, podcasts, learning paths, and
            communities
          </h2>
          <StyledSearchInput
            value={searchText}
            placeholder="What do you want to learn?"
            onSubmit={onSearchSubmit}
            onClear={onSearchClear}
            onChange={onSearchChange}
          />
          <div>
            <h3>Explore</h3>
            <SearchButtonsContainer>
              {EXPLORE_BUTTONS.map(({ label }) => (
                <StyledChipLink
                  color="secondary"
                  to=""
                  key={label}
                  label={label}
                />
              ))}
            </SearchButtonsContainer>
          </div>
        </Grid>
        <Grid item xs={12} md={5}>
          <div>
            <FrontPageImage
              alt="Photos from the MIT campus arranged to form the letter M"
              src="/static/images/infinite-front-page-image.png"
            />
          </div>
        </Grid>
      </TopContainer>
      <section>
        <h2>Upcoming Courses</h2>
        <TabbedCarousel config={UPCOMING_COURSES_CAROUSEL} />
      </section>
      <section>
        <h2>Media</h2>
        <TabbedCarousel config={MEDIA_CAROUSEL} />
      </section>
    </HomePageContainer>
  )
}

export default HomePage

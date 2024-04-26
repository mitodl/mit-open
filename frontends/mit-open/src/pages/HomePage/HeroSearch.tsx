import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import {
  Typography,
  SearchInput,
  SearchInputProps,
  Stack,
  styled,
  ChipLink,
  useMuiBreakpointAtLeast,
} from "ol-components"
import type { ChipLinkProps } from "ol-components"

type SearchChip = {
  label: string
  href: string
  variant?: ChipLinkProps["variant"]
  color?: ChipLinkProps["color"]
}

const SEARCH_CHIPS: SearchChip[] = [
  {
    label: "AI Courses",
    href: "/search?topic=Artificial+Intelligence&resource_type=course",
  },
  {
    label: "Engineering Courses",
    href: "/search?topic=Engineering&resource_type=course",
  },
  {
    label: "Explore All",
    href: "/search",
    variant: "filled",
    color: "primary",
  },
]

const ImageContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  ${({ theme }) => theme.breakpoints.down("sm")} {
    display: none;
  }

  img {
    max-width: 100%;
  }
`

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  ${({ theme }) => theme.breakpoints.down("sm")} {
    min-height: 272px;
  }
`

const SearchInputStyled = styled(SearchInput)`
  margin-top: 20px;
  margin-bottom: 20px;
`

const HeroSearch: React.FC = () => {
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
  const isMobile = !useMuiBreakpointAtLeast("sm")
  const placeholder = isMobile
    ? "Search subject, dept, professor, or course"
    : "Search for non-degree subject, dept, professor, or course"
  return (
    <Stack direction="row">
      <SearchContainer>
        <Typography
          typography={{ xs: "h3", md: "h1" }}
          sx={{ paddingBottom: 1 }}
        >
          Learn with MIT
        </Typography>
        <Typography>A place for all non-degree learning.</Typography>
        <SearchInputStyled
          placeholder={placeholder}
          size={isMobile ? "medium" : "hero"}
          fullWidth
          value={searchText}
          onChange={onSearchChange}
          onClear={onSearchClear}
          onSubmit={onSearchSubmit}
        />
        <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
          Popular Searches
        </Typography>
        <Stack direction="row" columnGap={1} flexWrap="wrap" rowGap={1}>
          {SEARCH_CHIPS.map(({ label, ...others }, index) => (
            <ChipLink key={index} size="medium" label={label} {...others} />
          ))}
        </Stack>
      </SearchContainer>
      <ImageContainer>
        <img src="/static/images/hero_woman.svg" />
      </ImageContainer>
    </Stack>
  )
}

export default HeroSearch

import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import {
  Container,
  Typography,
  SearchInput,
  SearchInputProps,
  styled,
  ChipLink,
  useMuiBreakpointAtLeast,
} from "ol-components"
import type { ChipLinkProps } from "ol-components"

type SearchChip = {
  label: string
  href: string
  variant?: ChipLinkProps["variant"]
}

const SEARCH_CHIPS: SearchChip[] = [
  {
    label: "New",
    href: "/search?topic=Artificial+Intelligence&resource_type=course",
    variant: "outlined",
  },
  {
    label: "Popular",
    href: "/search?topic=Engineering&resource_type=course",
  },
  {
    label: "Upcoming",
    href: "/search",
  },
  {
    label: "Free",
    href: "/search",
  },
  {
    label: "With Certificate",
    href: "/search",
  },
]

const HeroContainer = styled(Container)({
  display: "flex",
  flexDirection: "row",
})

const ImageContainer = styled.div`
  width: 400px;
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

const SquaredChip = styled(ChipLink, {
  shouldForwardProp: (propName) => propName !== "noBorder",
})<{ noBorder?: boolean }>(({ noBorder, theme }) => [
  {
    borderRadius: "4px",
    [theme.breakpoints.down("sm")]: {
      flex: 1,
      height: "32px",
    },
  },
  noBorder && {
    "&:not(:hover)": {
      borderColor: "white",
    },
  },
])

const ControlsContainer = styled.div(({ theme }) => ({
  marginTop: "24px",
  display: "flex",
  width: "100%",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: "20px",
  padding: "24px",
  backgroundColor: theme.custom.colors.white,
  borderRadius: "8px",
  boxShadow:
    "0px 2px 4px 0px rgba(37, 38, 43, 0.10), 0px 2px 4px 0px rgba(37, 38, 43, 0.10)",
}))
const LinksContainer = styled.div({
  width: "100%",
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "12px",
  justifyContent: "space-between",
})
const TrenderingContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    gap: "8px",
  },
}))
const BrowseContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: "8px",

  [theme.breakpoints.down("sm")]: {
    flex: 1,
  },
}))

const TitleAndControls = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
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
  return (
    <HeroContainer>
      <TitleAndControls>
        <Typography
          typography={{ xs: "h3", md: "h1" }}
          sx={{ paddingBottom: 1 }}
        >
          Learn with MIT
        </Typography>
        <Typography>A place for all non-degree learning.</Typography>
        <ControlsContainer>
          <SearchInput
            placeholder="Search for courses, programs, learning, and teaching materials"
            size={isMobile ? "medium" : "hero"}
            fullWidth
            value={searchText}
            onChange={onSearchChange}
            onClear={onSearchClear}
            onSubmit={onSearchSubmit}
          />
          <LinksContainer>
            <TrenderingContainer>
              <Typography typography={{ xs: "subtitle4", md: "subtitle3" }}>
                Trending
              </Typography>
              {SEARCH_CHIPS.map((chip) => (
                <SquaredChip
                  noBorder
                  key={chip.label}
                  variant={chip.variant}
                  size="medium"
                  label={chip.label}
                  href={chip.href}
                />
              ))}
            </TrenderingContainer>
            <BrowseContainer>
              <SquaredChip
                variant="outlined"
                size="medium"
                label="AI Courses"
                href="/search?topic=Artificial+Intelligence&resource_type=course"
              />
              <SquaredChip
                variant="filled"
                size="medium"
                label="Engineering Courses"
                href="/search?topic=Engineering&resource_type=course"
              />
            </BrowseContainer>
          </LinksContainer>
        </ControlsContainer>
      </TitleAndControls>
      <ImageContainer>
        <img src="/static/images/person_with_headphones.jpg" />
      </ImageContainer>
    </HeroContainer>
  )
}

export default HeroSearch

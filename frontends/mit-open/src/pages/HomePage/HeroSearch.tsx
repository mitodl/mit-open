import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import {
  Typography,
  SearchInput,
  SearchInputProps,
  styled,
  ChipLink,
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
    href: "/search?sortby=new",
    variant: "outlined",
  },
  {
    label: "Popular",
    href: "/search?sortby=-views",
  },
  {
    label: "Upcoming",
    href: "/search?sortby=upcoming",
  },
  {
    label: "Free",
    href: "/search?free=true",
  },
  {
    label: "With Certificate",
    href: "/search?certification=true",
  },
]

const HeroWrapper = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "51px",
  color: theme.custom.colors.darkGray2,
}))

const TitleAndControls = styled.div({
  flex: "1 1 auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  marginTop: "32px",
  marginBottom: "32px",
})

const ImageContainer = styled.div(({ theme }) => ({
  flex: "0 1.33 auto",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "22px",
  transform: "translateX(24px)",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
  img: {
    width: "100%",
  },
}))

const SquaredChip = styled(ChipLink, {
  shouldForwardProp: (propName) => !["noBorder", "grow"].includes(propName),
})<{ noBorder?: boolean; grow?: boolean }>(({ noBorder, theme, grow }) => [
  {
    borderRadius: "4px",
    [theme.breakpoints.down("sm")]: {
      ...theme.typography.body4,
      padding: "4px 0px",
    },
  },
  grow && {
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
  [theme.breakpoints.down("sm")]: {
    padding: "12px",
    gap: "16px",
  },
}))
const LinksContainer = styled.div(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "12px",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}))
const TrenderingContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
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

const Emphasized = styled.span(({ theme }) => ({
  fontWeight: theme.typography.subtitle1.fontWeight,
  ":hover": {
    textDecoration: "underline",
  },
}))

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
  return (
    <HeroWrapper>
      <TitleAndControls>
        <Typography
          typography={{ xs: "h3", md: "h1" }}
          sx={{ paddingBottom: 1 }}
        >
          Learn with MIT
        </Typography>
        <Typography>
          Explore MIT's <Emphasized>Non-Degree Education</Emphasized>
        </Typography>
        <ControlsContainer>
          <SearchInput
            placeholder="Search for courses, programs, learning, and teaching materials"
            size="hero"
            fullWidth
            value={searchText}
            onChange={onSearchChange}
            onClear={onSearchClear}
            onSubmit={onSearchSubmit}
          />
          <LinksContainer>
            <TrenderingContainer>
              <Typography
                sx={{ marginRight: "8px" }}
                typography={{ xs: "subtitle4", md: "subtitle3" }}
              >
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
                grow
                variant="outlined"
                size="medium"
                label="Browse by Topics"
                href="/topics/"
              />
              <SquaredChip
                grow
                variant="filled"
                size="medium"
                label="Explore All"
                href="/search/"
              />
            </BrowseContainer>
          </LinksContainer>
        </ControlsContainer>
      </TitleAndControls>
      <ImageContainer>
        <img alt="" src="/static/images/person_with_headphones.png" />
      </ImageContainer>
    </HeroWrapper>
  )
}

export default HeroSearch

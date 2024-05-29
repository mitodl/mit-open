import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import {
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
    href: "/search?sortby=new",
    variant: "outlined",
  },
  {
    label: "Popular",
    href: "/search?sortby=views",
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
  color: theme.custom.colors.darkGray1,
}))

const ImageContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: "48px",
  maxWidth: "400px",
  flex: 1,
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
  img: {
    width: "100%",
  },
}))

const SquaredChip = styled(ChipLink, {
  shouldForwardProp: (propName) => propName !== "noBorder",
})<{ noBorder?: boolean }>(({ noBorder, theme }) => [
  {
    borderRadius: "4px",
    [theme.breakpoints.down("sm")]: {
      flex: 1,
      height: "32px",
      padding: "4px 0px",
      ...theme.typography.body4,
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

const TitleAndControls = styled.div(({ theme }) => ({
  // flex: 1;
  // display: flex;
  // flex-direction: column;
  // align-items: flex-start;
  // justify-content: center;
  // margin-top: 120px;
  // margin-bottom: 120px;
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  marginTop: "120px",
  marginBottom: "120px",
  [theme.breakpoints.down("md")]: {
    marginTop: "32px",
    marginBottom: "32px",
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
  const isMobile = !useMuiBreakpointAtLeast("sm")
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
                label="Browse by Topics"
                href="/topics/"
              />
              <SquaredChip
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

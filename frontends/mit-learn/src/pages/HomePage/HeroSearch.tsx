import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { Typography, styled, ChipLink, Link } from "ol-components"
import type { ChipLinkProps } from "ol-components"
import { SearchInput, SearchInputProps } from "./SearchInput"
import { ABOUT } from "@/common/urls"
import { NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER } from "../AboutPage/AboutPage"
import {
  RiAddBoxLine,
  RiAwardLine,
  RiSearch2Line,
  RiThumbUpLine,
  RiTimeLine,
  RiVerifiedBadgeLine,
} from "@remixicon/react"

type SearchChip = {
  label: string
  href: string
  variant?: ChipLinkProps["variant"]
  icon?: React.ReactElement
}

const SEARCH_CHIPS: SearchChip[] = [
  {
    label: "Recently Added",
    href: "/search?sortby=new",
    variant: "outlinedWhite",
    icon: <RiTimeLine />,
  },
  {
    label: "Popular",
    href: "/search?sortby=-views",
    variant: "outlinedWhite",
    icon: <RiThumbUpLine />,
  },
  {
    label: "Upcoming",
    href: "/search?sortby=upcoming",
    variant: "outlinedWhite",
    icon: <RiAddBoxLine />,
  },
  {
    label: "Free",
    href: "/search?free=true",
    variant: "outlinedWhite",
    icon: <RiVerifiedBadgeLine />,
  },
  {
    label: "With Certificate",
    href: "/search?certification=true",
    variant: "outlinedWhite",
    icon: <RiAwardLine />,
  },
  {
    label: "Explore All",
    href: "/search/",
    variant: "gray",
    icon: <RiSearch2Line />,
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

const ControlsContainer = styled.div(({ theme }) => ({
  marginTop: "24px",
  display: "flex",
  width: "100%",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  [theme.breakpoints.down("sm")]: {
    padding: "12px",
    gap: "16px",
  },
  [theme.breakpoints.up("sm")]: {
    input: {
      paddingLeft: "5px",
    },
  },
}))

const BrowseByTopicContainer = styled.div({
  marginTop: "16px",
  marginBottom: "24px",
})

const BrowseByTopicText = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.silverGrayDark,
  ...theme.typography.body2,
}))

const LinksContainer = styled.div(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}))

const TrendingContainer = styled.div({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "8px",
})

const BoldLink = styled(Link)(({ theme }) => ({
  ...theme.typography.subtitle1,
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
          Explore MIT's{" "}
          <BoldLink
            href={`${ABOUT}#${NON_DEGREE_LEARNING_FRAGMENT_IDENTIFIER}`}
          >
            Non-Degree Learning
          </BoldLink>
        </Typography>
        <ControlsContainer>
          <SearchInput
            placeholder="Search for courses, programs, and learning materials..."
            size="hero"
            fullWidth
            value={searchText}
            onChange={onSearchChange}
            onClear={onSearchClear}
            onSubmit={onSearchSubmit}
          />
          <LinksContainer>
            <BrowseByTopicContainer>
              <BrowseByTopicText>
                or browse by{" "}
                <Link href="/topics/" color="red">
                  Topic
                </Link>
              </BrowseByTopicText>
            </BrowseByTopicContainer>
            <TrendingContainer>
              {SEARCH_CHIPS.map((chip) => (
                <ChipLink
                  key={chip.label}
                  variant={chip.variant}
                  size="medium"
                  label={chip.label}
                  href={chip.href}
                  {...(chip.icon && { icon: chip.icon })}
                />
              ))}
            </TrendingContainer>
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

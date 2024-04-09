import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { Grid, Typography, SearchInput, SearchInputProps } from "ol-components"

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
    <Grid container justifyContent="center">
      <Grid
        item
        xs={12}
        sm={8}
        md={6}
        container
        sx={(theme) => ({
          [theme.breakpoints.only("xs")]: {
            alignItems: "center",
          },
        })}
      >
        <Typography
          sx={{
            typography: { xs: "h3", sm: "h2", md: "h1" },
          }}
        >
          Learn with MIT
        </Typography>
        <Typography>A place for all non-degree learning.</Typography>
        <SearchInput
          size="hero"
          fullWidth
          value={searchText}
          onChange={onSearchChange}
          onClear={onSearchClear}
          onSubmit={onSearchSubmit}
        />
      </Grid>
      <Grid item xs={12} sm={4} md={4} display={{ xs: "none", sm: "flex" }}>
        <img style={{ minWidth: 0 }} src="/static/images/hero_woman.svg" />
      </Grid>
    </Grid>
  )
}

export default HeroSearch

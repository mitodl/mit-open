import React from "react"
import {
  useFeaturedLearningResourcesList,
  learningResourcesKeyFactory,
} from "api/hooks/learningResources"

import {
  Carousel,
  TabButton,
  TabPanel,
  TabContext,
  TabButtonList,
  styled,
  Typography,
} from "ol-components"
import type { TabConfig, FeaturedDataSource } from "./types"
import { LearningResource, PaginatedLearningResourceList } from "api"
import { ResourceCard } from "../ResourceCard/ResourceCard"
import { useQueries, UseQueryResult } from "@tanstack/react-query"

const StyledCarousel = styled(Carousel)({
  /**
   * Our cards have a hover shadow that gets clipped by the carousel container.
   * To compensate for this, we add a 4px padding to the left of each slide, and
   * remove 4px from the gap.
   */
  width: "calc(100% + 4px)",
  transform: "translateX(-4px)",
  ".slick-track": {
    display: "flex",
    gap: "20px",
    marginBottom: "4px",
  },
  ".slick-slide": {
    paddingLeft: "4px",
  },
})

type LoadTabButtonProps = {
  config: FeaturedDataSource
  label: React.ReactNode
  key: number
  value: string
}

/**
 * Tab button that loads the resource, so we can determine if it needs to be
 * displayed or not. This shouldn't cause double-loading since React Query
 * should only run the thing once - when you switch into the tab, the data
 * should already be in the cache.
 */

const LoadFeaturedTabButton: React.FC<LoadTabButtonProps> = (props) => {
  const { data, isLoading } = useFeaturedLearningResourcesList(
    props.config.params,
  )

  return !isLoading && data && data.count > 0 ? <TabButton {...props} /> : null
}

const HeaderRow = styled.div(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "24px",
  [theme.breakpoints.down("sm")]: {
    alignItems: "flex-start",
    flexDirection: "column",
    marginBottom: "0px",
  },
}))

const HeaderText = styled(Typography)(({ theme }) => ({
  paddingRight: "16px",
  [theme.breakpoints.down("sm")]: {
    paddingBottom: "16px",
    ...theme.typography.h5,
  },
}))

const ControlsContainer = styled.div(({ theme }) => ({
  display: "flex",
  flex: 1,
  minWidth: "0px",
  maxWidth: "100%",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    paddingBottom: "16px",
  },
}))

const StyledTabPanel = styled(TabPanel)({
  paddingTop: "0px",
  paddingLeft: "0px",
  paddingRight: "0px",
})

const ButtonsContainer = styled.div(({ theme }) => ({
  display: "flex",
  gap: "8px",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}))

const TabsList = styled(TabButtonList)({
  ".MuiTabScrollButton-root.Mui-disabled": {
    display: "none",
  },
})

type ContentProps = {
  resources: LearningResource[]
  childrenLoading?: boolean
  tabConfig: TabConfig
}

type PanelChildrenProps = {
  config: TabConfig[]
  queries: UseQueryResult<PaginatedLearningResourceList, unknown>[]
  children: (props: ContentProps) => React.ReactNode
}
const PanelChildren: React.FC<PanelChildrenProps> = ({
  config,
  queries,
  children,
}) => {
  if (config.length === 1) {
    const { data, isLoading } = queries[0]
    const resources = data?.results ?? []
    return children({
      resources,
      childrenLoading: isLoading,
      tabConfig: config[0],
    })
  }
  return (
    <>
      {config.map((tabConfig, index) => {
        const { data, isLoading } = queries[index]
        const resources = data?.results ?? []
        return (
          <StyledTabPanel key={index} value={index.toString()}>
            {children({
              resources,
              childrenLoading: isLoading,
              tabConfig,
            })}
          </StyledTabPanel>
        )
      })}
    </>
  )
}

const MobileOverflow = styled.div(({ theme }) => ({
  /**
   * On mobile screens, the carousel is supposed to overflow the main content
   * so its right edge is flush with screen.
   *
   * The mobile content margin is 16px, so we add that to its width.
   */
  [theme.breakpoints.down("sm")]: {
    width: "calc(100% + 16px)",
  },
}))

type ResourceCarouselProps = {
  config: TabConfig[]
  title: string
  className?: string
  isLoading?: boolean
  "data-testid"?: string
}
/**
 * A tabbed carousel that fetches resources based on the configuration provided.
 *  - each TabConfig generates a tab + tabpanel that pulls data from an API based
 *    on the config
 *  - data is lazily when the tabpanel first becomes visible
 *
 * For now, this is a carousel of learning resource cards, to be moved out if/when it is needed for other items.
 *
 * If there is only one tab, the carousel will not have tabs, and will just show
 * the content.
 */
const ResourceCarousel: React.FC<ResourceCarouselProps> = ({
  config,
  title,
  className,
  isLoading,
  "data-testid": dataTestId,
}) => {
  const [tab, setTab] = React.useState("0")
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queries = useQueries<any>({
    // const queries = useQueries<UseQueryResult<PaginatedLearningResourceList, unknown>[]>({
    queries: config.map((tab) => {
      switch (tab.data.type) {
        case "resources":
          return learningResourcesKeyFactory.list(tab.data.params)
        case "lr_search":
          return learningResourcesKeyFactory.search(tab.data.params)
        case "lr_featured":
          return learningResourcesKeyFactory.featured(tab.data.params)
      }
    }),
  })

  if (
    !isLoading &&
    !queries.find(
      (query) => !query.isLoading && (query.data as { count: number })?.count,
    )
  ) {
    return null
  }

  return (
    <MobileOverflow className={className} data-testid={dataTestId}>
      <TabContext value={tab}>
        <HeaderRow>
          <HeaderText variant="h4">{title}</HeaderText>
          {config.length === 1 ? <ButtonsContainer ref={setRef} /> : null}
          {config.length > 1 ? (
            <ControlsContainer>
              <TabsList onChange={(e, newValue) => setTab(newValue)}>
                {config.map((tabConfig, index) => {
                  if (
                    !isLoading &&
                    !queries[index].isLoading &&
                    !(queries[index].data as { count: number })?.count
                  ) {
                    return null
                  }
                  return tabConfig.data.type === "lr_featured" ? (
                    <LoadFeaturedTabButton
                      config={tabConfig.data}
                      key={index}
                      label={tabConfig.label}
                      value={index.toString()}
                    />
                  ) : (
                    <TabButton
                      key={index}
                      label={tabConfig.label}
                      value={index.toString()}
                    />
                  )
                })}
              </TabsList>
              <ButtonsContainer ref={setRef} />
            </ControlsContainer>
          ) : null}
        </HeaderRow>
        <PanelChildren
          config={config}
          queries={
            queries as UseQueryResult<PaginatedLearningResourceList, unknown>[]
          }
        >
          {({ resources, childrenLoading, tabConfig }) => (
            <StyledCarousel arrowsContainer={ref}>
              {isLoading || childrenLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <ResourceCard
                      isLoading
                      key={index}
                      resource={null}
                      {...tabConfig.cardProps}
                    />
                  ))
                : resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      {...tabConfig.cardProps}
                    />
                  ))}
            </StyledCarousel>
          )}
        </PanelChildren>
      </TabContext>
    </MobileOverflow>
  )
}

export default ResourceCarousel
export type { ResourceCarouselProps }
export type { TabConfig }

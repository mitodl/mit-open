import React from "react"
import {
  useFeaturedLearningResourcesList,
  useLearningResourcesList,
  useLearningResourcesSearch,
} from "api/hooks/learningResources"
import {
  TabButton,
  TabPanel,
  TabContext,
  TabButtonList,
  styled,
  Typography,
  Skeleton,
} from "ol-components"
import type { Theme } from "ol-components"
import { Carousel } from "./Carousel"
import type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  FeaturedDataSource,
} from "./types"
import { LearningResource } from "api"
import LearningResourceCard from "../LearningResourceCard/LearningResourceCard"

type DataPanelProps<T extends TabConfig["data"] = TabConfig["data"]> = {
  dataConfig: T
  children: ({
    resources,
    isLoading,
  }: {
    resources: LearningResource[]
    isLoading: boolean
  }) => React.ReactNode
}

const ResourcesData: React.FC<DataPanelProps<ResourceDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useLearningResourcesList(dataConfig.params)
  return children({ resources: data?.results ?? [], isLoading })
}

const SearchData: React.FC<DataPanelProps<SearchDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useLearningResourcesSearch(dataConfig.params)
  return children({ resources: data?.results ?? [], isLoading })
}

const FeaturedData: React.FC<DataPanelProps<FeaturedDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useFeaturedLearningResourcesList(
    dataConfig.params,
  )
  return children({ resources: data?.results ?? [], isLoading })
}

/**
 * A wrapper to load data based `TabConfig.data`.
 *
 * For each `TabConfig.data.type`, a different API endpoint, and hence
 * react-query hook, is used. Since hooks can't be called conditionally within
 * a single component, each type of data is handled in a separate component.
 */
const DataPanel: React.FC<DataPanelProps> = ({ dataConfig, children }) => {
  switch (dataConfig.type) {
    case "resources":
      return <ResourcesData dataConfig={dataConfig}>{children}</ResourcesData>
    case "lr_search":
      return <SearchData dataConfig={dataConfig}>{children}</SearchData>
    case "lr_featured":
      return <FeaturedData dataConfig={dataConfig}>{children}</FeaturedData>
    default:
      // @ts-expect-error This will always be an error if the switch statement
      // is exhaustive since dataConfig will have type `never`
      throw new Error(`Unknown data type: ${dataConfig.type}`)
  }
}

const CarouselStyled = styled(Carousel)`
  .nuka-wrapper {
    /**
    Prevent shift while loading.
    This is a bit arbitrary and would be better handled by placeholder "skeleton"
    cards.
    */
    min-height: 354px;
  }
`

const CardStyles = ({
  theme,
  size,
}: {
  theme: Theme
  size?: "small" | "medium"
}) => [
  {
    borderRadius: "8px",
    border: `1px solid ${theme.custom.colors.silverGray}`,
    boxShadow: "none",
  },
  size === "small" && {
    minWidth: "192px",
    maxWidth: "192px",
  },
  size === "medium" && {
    minWidth: "300px",
    maxWidth: "300px",
  },
]

const LearningResourceCardStyled = styled(LearningResourceCard)<{
  size?: "small" | "medium"
}>(({ theme, size = "medium" }) => CardStyles({ theme, size }))

const SkeletonCardUnstyled: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={className}>
    <Skeleton variant="rectangular" width="100%" height="50%" />
    <div>
      {" "}
      <Skeleton variant="text" width="30%" />
      <Typography variant="h3">
        <Skeleton width="75%" />
      </Typography>
      <Skeleton variant="text" />
      <Skeleton variant="text" width="75%" />
    </div>
    <div>
      <Skeleton variant="text" width="50%" />
    </div>
  </div>
)
const SkeletonCard = styled(SkeletonCardUnstyled)<{
  size?: "small" | "medium"
}>(({ theme, size = "medium" }) => [
  ...CardStyles({ theme, size }),
  { display: "flex", flexDirection: "column", justifyContent: "space-between" },
])

type TabbedCarouselProps = {
  config: TabConfig[]
  title: string
}

const HeaderRow = styled.div(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "16px",
  marginBottom: "16px",
  [theme.breakpoints.down("sm")]: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
}))
const ControlsContainer = styled.div({
  display: "flex",
  flex: 1,
  minWidth: "0px",
  maxWidth: "100%",
  justifyContent: "space-between",
})

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
  isLoading?: boolean
}

type CarouselContentProps = {
  config: TabConfig[]
  children: (props: ContentProps) => React.ReactNode
}
const CarouselContent: React.FC<CarouselContentProps> = ({
  config,
  children,
}) => {
  if (config.length === 1) {
    return (
      <DataPanel dataConfig={config[0].data}>
        {({ resources, isLoading }) => children({ resources, isLoading })}
      </DataPanel>
    )
  }
  return (
    <>
      {config.map((tabConfig, index) => (
        <StyledTabPanel key={index} value={index.toString()}>
          <DataPanel dataConfig={tabConfig.data}>
            {({ resources, isLoading }) =>
              children({
                resources,
                isLoading,
              })
            }
          </DataPanel>
        </StyledTabPanel>
      ))}
    </>
  )
}

/**
 * A tabbed carousel that fetches resources based on the configuration provided.
 *  - each TabConfig generates a tab + tabpanel that pulls data from an API based
 *    on the config
 *  - data is lazily when the tabpanel first becomes visible
 */
const TabbedCarousel: React.FC<TabbedCarouselProps> = ({ config, title }) => {
  const [tab, setTab] = React.useState("0")
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null)
  return (
    <section>
      <TabContext value={tab}>
        <HeaderRow>
          <Typography variant="h3">{title}</Typography>
          <ControlsContainer>
            {config.length === 1 ? null : (
              <TabsList onChange={(e, newValue) => setTab(newValue)}>
                {config.map(({ label }, index) => (
                  <TabButton
                    key={index}
                    label={label}
                    value={index.toString()}
                  />
                ))}
              </TabsList>
            )}
            <ButtonsContainer ref={setRef} />
          </ControlsContainer>
        </HeaderRow>
        <CarouselContent config={config}>
          {({ resources, isLoading }) => (
            <CarouselStyled arrowsContainer={ref}>
              {
                // Show skeleton cards while loading
                isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  : resources.map((resource) => (
                      <LearningResourceCardStyled
                        key={resource.id}
                        variant="column"
                        resource={resource}
                        {...config[0].cardProps}
                      />
                    ))
              }
            </CarouselStyled>
          )}
        </CarouselContent>
      </TabContext>
    </section>
  )
}

export default TabbedCarousel
export type { TabbedCarouselProps }
export type { TabConfig }

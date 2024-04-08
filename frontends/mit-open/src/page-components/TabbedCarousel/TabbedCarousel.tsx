import React from "react"
import {
  useLearningResourcesList,
  useLearningResourcesUpcoming,
  useLearningResourcesSearch,
} from "api/hooks/learningResources"
import {
  Tab,
  TabPanel,
  TabContext,
  TabList,
  Carousel,
  styled,
} from "ol-components"
import type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  UpcomingDataSource,
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

const UpcomingResourcesData: React.FC<DataPanelProps<UpcomingDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useLearningResourcesUpcoming(dataConfig.params)
  return children({ resources: data?.results ?? [], isLoading })
}

const SearchData: React.FC<DataPanelProps<SearchDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useLearningResourcesSearch(dataConfig.params)
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
    case "resources_upcoming":
      return (
        <UpcomingResourcesData dataConfig={dataConfig}>
          {children}
        </UpcomingResourcesData>
      )
    default:
      // @ts-expect-error This will always be an error if the switch statement
      // is exhaustive since dataConfig will have type `never`
      throw new Error(`Unknown data type: ${dataConfig.type}`)
  }
}

const CarouselStyled = styled(Carousel)`
  .slider-list {
    /**
    Prevent shift while loading.
    This is a bit arbitrary and would be better handled by placeholder "skeleton"
    cards.
    */
    min-height: 354px;
  }
`

const LearningResourceCardStyled = styled(LearningResourceCard)({
  height: "100%",
})

type TabbedCarouselProps = {
  config: TabConfig[]
}

/**
 * A tabbed carousel that fetches resources based on the configuration provided.
 *  - each TabConfig generates a tab + tabpanel that pulls data from an API based
 *    on the config
 *  - data is lazily when the tabpanel first becomes visible
 */
const TabbedCarousel: React.FC<TabbedCarouselProps> = ({ config }) => {
  const [tab, setTab] = React.useState("0")

  return (
    <TabContext value={tab}>
      <TabList onChange={(e, newValue) => setTab(newValue)}>
        {config.map(({ label }, index) => (
          <Tab key={index} label={label} value={index.toString()} />
        ))}
      </TabList>
      {config.map(({ data, pageSize }, index) => (
        <TabPanel key={index} value={index.toString()}>
          <DataPanel dataConfig={data}>
            {({ resources }) => (
              <CarouselStyled pageSize={pageSize}>
                {resources.map((resource) => (
                  <LearningResourceCardStyled
                    key={resource.id}
                    variant="column"
                    resource={resource}
                  />
                ))}
              </CarouselStyled>
            )}
          </DataPanel>
        </TabPanel>
      ))}
    </TabContext>
  )
}

export default TabbedCarousel
export type { TabbedCarouselProps }

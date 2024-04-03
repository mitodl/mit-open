import React from "react"
import {
  useLearningResourcesList,
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
import type { TabConfig, ResourceDataSource, SearchDataSource } from "./types"
import { LearningResource } from "api"
import LearningResourceCard from "../LearningResourceCard/LearningResourceCard"

type DataPanelProps<T extends TabConfig["data"] = TabConfig["data"]> = T & {
  children: ({
    resources,
    isLoading,
  }: {
    resources: LearningResource[]
    isLoading: boolean
  }) => React.ReactNode
}

const ResourcesData: React.FC<
  Omit<DataPanelProps<ResourceDataSource>, "type">
> = ({ params, children }) => {
  const { data, isLoading } = useLearningResourcesList(params)
  return children({ resources: data?.results ?? [], isLoading })
}

const SearchData: React.FC<Omit<DataPanelProps<SearchDataSource>, "type">> = ({
  params,
  children,
}) => {
  const { data, isLoading } = useLearningResourcesSearch(params)
  return children({ resources: data?.results ?? [], isLoading })
}

const DataPanel: React.FC<DataPanelProps> = ({ type, params, children }) => {
  switch (type) {
    case "resources":
      return <ResourcesData params={params}>{children}</ResourcesData>
    case "lr_search":
      return <SearchData params={params}>{children}</SearchData>
    default:
      throw new Error(`Unknown data type: ${type}`)
  }
}

const LearningResourceCardStyled = styled(LearningResourceCard)({
  height: "100%",
})

type TabbedCarouselProps = {
  config: TabConfig[]
}
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
          <DataPanel {...data}>
            {({ resources }) => (
              <Carousel pageSize={pageSize}>
                {resources.map((resource) => (
                  <LearningResourceCardStyled
                    key={resource.id}
                    variant="column"
                    resource={resource}
                  />
                ))}
              </Carousel>
            )}
          </DataPanel>
        </TabPanel>
      ))}
    </TabContext>
  )
}

export default TabbedCarousel
export type { TabbedCarouselProps }

import React from "react"
import {
  useFeaturedLearningResourcesList,
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
  Typography,
} from "ol-components"
import type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  FeaturedDataSource,
} from "./types"
import { LearningResource } from "api"
import LearningResourceCard from "../LearningResourceCard/LearningResourceCard"
import type { LearningResourceCardProps } from "../LearningResourceCard/LearningResourceCard"

type LearningResourceCardStyledProps = LearningResourceCardProps & {
  cardsPerPage: number
}

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
  .slider-list {
    /**
    Prevent shift while loading.
    This is a bit arbitrary and would be better handled by placeholder "skeleton"
    cards.
    */
    min-height: 354px;
  }
`

const LearningResourceCardStyled = styled(
  LearningResourceCard,
)<LearningResourceCardStyledProps>`
  min-width: calc(
    ${(props) => Number(100 / props.cardsPerPage).toPrecision(2)}% - 24px
  );
  max-width: calc(
    ${(props) => Number(100 / props.cardsPerPage).toPrecision(2)}% - 24px
  );
  margin: 6px 26px 6px 0;
`

type TabbedCarouselProps = {
  config: TabConfig[]
  title: string
}

const HeaderRow = styled.div({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
})
const ButtonsContainer = styled.div(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}))

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
          <Typography sx={{ flexShrink: 2 }} variant="h3">
            {title}
          </Typography>
          <ButtonsContainer ref={setRef}></ButtonsContainer>
        </HeaderRow>
        <TabList
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          onChange={(e, newValue) => setTab(newValue)}
        >
          {config.map(({ label }, index) => (
            <Tab key={index} label={label} value={index.toString()} />
          ))}
        </TabList>
        {config.map(({ data, pageSize }, index) => (
          <TabPanel key={index} value={index.toString()}>
            <DataPanel dataConfig={data}>
              {({ resources }) => (
                <CarouselStyled pageSize={pageSize} arrowsContainer={ref}>
                  {resources.map((resource) => (
                    <LearningResourceCardStyled
                      key={resource.id}
                      variant="column"
                      resource={resource}
                      cardsPerPage={pageSize}
                    />
                  ))}
                </CarouselStyled>
              )}
            </DataPanel>
          </TabPanel>
        ))}
      </TabContext>
    </section>
  )
}

export default TabbedCarousel
export type { TabbedCarouselProps }

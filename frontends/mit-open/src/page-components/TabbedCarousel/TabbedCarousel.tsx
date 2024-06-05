import React from "react"
import * as NiceModal from "@ebay/nice-modal-react"
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
  LearningResourceCard,
  Typography,
} from "ol-components"
import type {
  TabConfig,
  ResourceDataSource,
  SearchDataSource,
  FeaturedDataSource,
} from "./types"
import { LearningResource } from "api"
import { useUserMe } from "api/hooks/user"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import { useOpenLearningResourceDrawer } from "../LearningResourceDrawer/LearningResourceDrawer"

type CardStyleProps = {
  cardsPerPage: number
}
const LearningResourceCardStyled = styled(LearningResourceCard)<CardStyleProps>`
  ${({ cardsPerPage }) => `
    min-width: calc(${100 / cardsPerPage}% - ${((cardsPerPage - 1) / cardsPerPage) * 24}px);
    max-width: calc(${100 / cardsPerPage}% - ${((cardsPerPage - 1) / cardsPerPage) * 24}px);
  `}
  margin: 6px 24px 6px 0;
`

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
 *
 * For now, this is a carousel of learning resource cards, to be moved out if/when it is needed for other items.
 */
const TabbedCarousel: React.FC<TabbedCarouselProps> = ({ config }) => {
  const { data: user } = useUserMe()
  const [tab, setTab] = React.useState("0")
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null)

  const showAddToLearningPathDialog =
    user?.is_authenticated && user?.is_learning_path_editor
      ? (resourceId: number) => {
          NiceModal.show(AddToLearningPathDialog, { resourceId })
        }
      : null

  const showAddToUserListDialog = user?.is_authenticated
    ? (resourceId: number) => {
        NiceModal.show(AddToUserListDialog, { resourceId })
      }
    : null

  const openLRDrawer = useOpenLearningResourceDrawer()

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
        {config.map(({ data, pageSize, size }, index) => (
          <TabPanel key={index} value={index.toString()}>
            <DataPanel dataConfig={data}>
              {({ resources, isLoading }) => {
                if (isLoading) {
                  return (
                    <Carousel arrowsContainer={ref} pageSize={pageSize}>
                      {Array.from({ length: pageSize }, (_, i) => (
                        <LearningResourceCardStyled
                          key={i}
                          isLoading
                          size={size}
                          cardsPerPage={pageSize}
                        />
                      ))}
                    </Carousel>
                  )
                }
                return (
                  <Carousel pageSize={pageSize}>
                    {resources.map((resource) => (
                      <LearningResourceCardStyled
                        key={resource.id}
                        resource={resource}
                        size={size}
                        cardsPerPage={pageSize}
                        onActivate={openLRDrawer}
                        onAddToLearningPathClick={showAddToLearningPathDialog}
                        onAddToUserListClick={showAddToUserListDialog}
                      />
                    ))}
                  </Carousel>
                )
              }}
            </DataPanel>
          </TabPanel>
        ))}
      </TabContext>
    </section>
  )
}

export default TabbedCarousel
export type { TabbedCarouselProps }

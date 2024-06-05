import React from "react"
import * as NiceModal from "@ebay/nice-modal-react"
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
  LearningResourceCard,
  Typography,
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
import { useUserMe } from "api/hooks/user"
import {
  AddToLearningPathDialog,
  AddToUserListDialog,
} from "../Dialogs/AddToListDialog"
import { useOpenLearningResourceDrawer } from "../LearningResourceDrawer/LearningResourceDrawer"

type CardStyleProps = {
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
  tabConfig: TabConfig
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
        {({ resources, isLoading }) =>
          children({ resources, isLoading, tabConfig: config[0] })
        }
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
                tabConfig,
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
 *
 * For now, this is a carousel of learning resource cards, to be moved out if/when it is needed for other items.
 */
const TabbedCarousel: React.FC<TabbedCarouselProps> = ({ config, title }) => {
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
          {({ resources, isLoading, tabConfig }) => (
            <Carousel arrowsContainer={ref}>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <LearningResourceCard key={index} resource={null} />
                  ))
                : resources.map((resource) => (
                    <LearningResourceCard
                      key={resource.id}
                      resource={resource}
                      {...tabConfig.cardProps}
                      onAddToLearningPathClick={showAddToLearningPathDialog}
                      onAddToUserListClick={showAddToUserListDialog}
                      onActivate={() => openLRDrawer(resource.id)}
                    />
                  ))}
            </Carousel>
          )}
        </CarouselContent>
      </TabContext>
    </section>
  )
}

export default TabbedCarousel
export type { TabbedCarouselProps }
export type { TabConfig }

import React from "react"
import * as NiceModal from "@ebay/nice-modal-react"
import {
  useFeaturedLearningResourcesList,
  useLearningResourcesList,
  useLearningResourcesSearch,
} from "api/hooks/learningResources"
import {
  Carousel,
  TabButton,
  TabPanel,
  TabContext,
  TabButtonList,
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

const LearningResourceCardStyled = styled(LearningResourceCard)({
  boxShadow: "none",
  ":hover": {
    boxShadow:
      "0 2px 4px 0 rgb(37 38 43 / 10%), 0 2px 4px 0 rgb(37 38 43 / 10%)",
  },
})

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

type DataPanelProps<T extends TabConfig["data"] = TabConfig["data"]> = {
  dataConfig: T
  isLoading?: boolean
  children: ({
    resources,
    childrenLoading,
  }: {
    resources: LearningResource[]
    childrenLoading: boolean
  }) => React.ReactNode
}

const ResourcesData: React.FC<DataPanelProps<ResourceDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useLearningResourcesList(dataConfig.params)
  return children({
    resources: data?.results ?? [],
    childrenLoading: isLoading,
  })
}

const SearchData: React.FC<DataPanelProps<SearchDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useLearningResourcesSearch(dataConfig.params)
  return children({
    resources: data?.results ?? [],
    childrenLoading: isLoading,
  })
}

const FeaturedData: React.FC<DataPanelProps<FeaturedDataSource>> = ({
  dataConfig,
  children,
}) => {
  const { data, isLoading } = useFeaturedLearningResourcesList(
    dataConfig.params,
  )
  return children({
    resources: data?.results ?? [],
    childrenLoading: isLoading,
  })
}

/**
 * A wrapper to load data based `TabConfig.data`.
 *
 * For each `TabConfig.data.type`, a different API endpoint, and hence
 * react-query hook, is used. Since hooks can't be called conditionally within
 * a single component, each type of data is handled in a separate component.
 */
const DataPanel: React.FC<DataPanelProps> = ({
  dataConfig,
  isLoading,
  children,
}) => {
  if (!isLoading) {
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
  } else
    return children({
      resources: [],
      childrenLoading: true,
    })
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
  isLoading?: boolean
  tabConfig: TabConfig
}

type PanelChildrenProps = {
  config: TabConfig[]
  children: (props: ContentProps) => React.ReactNode
  isLoading?: boolean
}
const PanelChildren: React.FC<PanelChildrenProps> = ({
  config,
  children,
  isLoading,
}) => {
  if (config.length === 1) {
    return (
      <DataPanel dataConfig={config[0].data} isLoading={isLoading}>
        {({ resources, childrenLoading }) =>
          children({
            resources,
            isLoading: childrenLoading || isLoading,
            tabConfig: config[0],
          })
        }
      </DataPanel>
    )
  }
  return (
    <>
      {config.map((tabConfig, index) => (
        <StyledTabPanel key={index} value={index.toString()}>
          <DataPanel dataConfig={tabConfig.data} isLoading={isLoading}>
            {({ resources, childrenLoading }) =>
              children({
                resources,
                isLoading: childrenLoading || isLoading,
                tabConfig,
              })
            }
          </DataPanel>
        </StyledTabPanel>
      ))}
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
}) => {
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
    <MobileOverflow className={className}>
      <TabContext value={tab}>
        <HeaderRow>
          <HeaderText variant="h4">{title}</HeaderText>
          {config.length === 1 ? <ButtonsContainer ref={setRef} /> : null}
          {config.length > 1 ? (
            <ControlsContainer>
              <TabsList onChange={(e, newValue) => setTab(newValue)}>
                {config.map(({ label }, index) => (
                  <TabButton
                    key={index}
                    label={label}
                    value={index.toString()}
                  />
                ))}
              </TabsList>
              <ButtonsContainer ref={setRef} />
            </ControlsContainer>
          ) : null}
        </HeaderRow>
        <PanelChildren config={config} isLoading={isLoading}>
          {({ resources, isLoading: childrenLoading, tabConfig }) => (
            <StyledCarousel arrowsContainer={ref}>
              {isLoading || childrenLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <LearningResourceCardStyled
                      isLoading
                      key={index}
                      resource={null}
                      {...tabConfig.cardProps}
                    />
                  ))
                : resources.map((resource) => (
                    <LearningResourceCardStyled
                      key={resource.id}
                      resource={resource}
                      {...tabConfig.cardProps}
                      onAddToLearningPathClick={showAddToLearningPathDialog}
                      onAddToUserListClick={showAddToUserListDialog}
                      onActivate={() => openLRDrawer(resource.id)}
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

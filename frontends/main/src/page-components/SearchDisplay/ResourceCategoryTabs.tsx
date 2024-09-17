import React from "react"
import {
  TabButton,
  TabContext,
  TabButtonList,
  TabPanel,
  styled,
} from "ol-components"
import { ResourceCategoryEnum, LearningResourcesSearchResponse } from "api"

const TabsList = styled(TabButtonList)(({ theme }) => ({
  ".MuiTabScrollButton-root.Mui-disabled": {
    display: "none",
  },
  [theme.breakpoints.down("md")]: {
    "div div button": {
      minWidth: "0 !important",
    },
  },
}))

const CountSpan = styled.span(({ theme }) => ({
  ...theme.typography.body3,
}))

type TabConfig = {
  label: string
  name: string
  defaultTab?: boolean
  resource_category: ResourceCategoryEnum | null
  minWidth: number
}

type Aggregations = LearningResourcesSearchResponse["metadata"]["aggregations"]
const resourceCategoryCounts = (aggregations?: Aggregations) => {
  if (!aggregations) return null
  const buckets = aggregations?.resource_category ?? []
  const counts = buckets.reduce(
    (acc, bucket) => {
      acc[bucket.key as ResourceCategoryEnum] = bucket.doc_count
      return acc
    },
    {} as Record<ResourceCategoryEnum, number>,
  )
  return counts
}
const appendCount = (label: string, count?: number | null) => {
  if (Number.isFinite(count)) {
    return (
      <>
        {label}&nbsp;<CountSpan>({count})</CountSpan>
      </>
    )
  }
  return label
}

/**
 *
 */
const ResourceCategoryTabContext: React.FC<{
  activeTabName: string
  children: React.ReactNode
}> = ({ activeTabName, children }) => {
  return (
    <TabContext value={activeTabName}>
      <>{children}</>
    </TabContext>
  )
}

type ResourceCategoryTabsProps = {
  aggregations?: Aggregations
  tabs: TabConfig[]
  setSearchParams: (fn: (prev: URLSearchParams) => URLSearchParams) => void
  onTabChange?: () => void
  className?: string
}
const ResourceCategoryTabList: React.FC<ResourceCategoryTabsProps> = ({
  tabs,
  aggregations,
  setSearchParams,
  onTabChange,
  className,
}) => {
  const counts = resourceCategoryCounts(aggregations)
  const allCount = aggregations?.resource_category
    ? (aggregations.resource_category || []).reduce((count, bucket) => {
        count = count + bucket.doc_count
        return count
      }, 0)
    : undefined

  return (
    <TabsList
      className={className}
      onChange={(_e, value) => {
        const tab = tabs.find((t) => t.name === value)
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          if (tab?.resource_category) {
            next.set("resource_category", tab.resource_category)
          } else {
            next.delete("resource_category")
          }
          return next
        })
        onTabChange?.()
      }}
    >
      {tabs.map((t) => {
        let count: number | undefined
        if (t.name === "all") {
          count = allCount
        } else {
          count =
            counts && t.resource_category
              ? (counts[t.resource_category] ?? 0)
              : undefined
        }
        return (
          <TabButton
            style={{ minWidth: t.minWidth }}
            key={t.name}
            value={t.name}
            label={appendCount(t.label, count)}
          />
        )
      })}
    </TabsList>
  )
}

const ResourceCategoryTabPanels: React.FC<{
  tabs: TabConfig[]
  children?: React.ReactNode
}> = ({ tabs, children }) => {
  return (
    <>
      {tabs.map((t) => (
        <TabPanel key={t.name} value={t.name}>
          {children}
        </TabPanel>
      ))}
    </>
  )
}

/**
 * Components for a tabbed search UI with tabs controlling resource_category facet.
 *
 * Intended usage is:
 * ```jsx
 * <ResourceCategoryTabs.Context>
 *    <ResourceCategoryTabs.TabList />
 *    <ResourceCategoryTabPanels>
 *      Panel Content
 *    </ResourceCategoryTabPanels>
 * <ResourceCategoryTabs.Context>
 * ```
 *
 * These are exported as three separate components (Context, TabList, TabPanels)
 * to facilitate placement within a grid layout.
 */
const ResourceCategoryTabs = {
  Context: ResourceCategoryTabContext,
  TabList: ResourceCategoryTabList,
  TabPanels: ResourceCategoryTabPanels,
}

export { ResourceCategoryTabs }
export type { TabConfig }

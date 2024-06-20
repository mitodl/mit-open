import React, { useMemo } from "react"
import {
  TabButton,
  TabContext,
  TabButtonList,
  TabPanel,
  styled,
} from "ol-components"
import { ResourceTypeEnum, LearningResourceSearchResponse } from "api"

const TabsList = styled(TabButtonList)({
  ".MuiTabScrollButton-root.Mui-disabled": {
    display: "none",
  },
})

const CountSpan = styled.span`
  min-width: 35px;
  text-align: left;
`
type TabConfig = {
  label: string
  name: string
  defaultTab?: boolean
  resource_type: ResourceTypeEnum[]
}

type Aggregations = LearningResourceSearchResponse["metadata"]["aggregations"]
const resourceTypeCounts = (aggregations?: Aggregations) => {
  if (!aggregations) return null
  const buckets = aggregations?.resource_type ?? []
  const counts = buckets.reduce(
    (acc, bucket) => {
      acc[bucket.key as ResourceTypeEnum] = bucket.doc_count
      return acc
    },
    {} as Record<ResourceTypeEnum, number>,
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
const ResourceTypesTabContext: React.FC<{
  activeTabName: string
  children: React.ReactNode
}> = ({ activeTabName, children }) => {
  return <TabContext value={activeTabName}>{children}</TabContext>
}

type ResourceTypeTabsProps = {
  aggregations?: Aggregations
  tabs: TabConfig[]
  setSearchParams: (fn: (prev: URLSearchParams) => URLSearchParams) => void
  onTabChange?: () => void
  className?: string
}
const ResourceTypeTabList: React.FC<ResourceTypeTabsProps> = ({
  tabs,
  aggregations,
  setSearchParams,
  onTabChange,
  className,
}) => {
  const withCounts = useMemo(() => {
    const counts = resourceTypeCounts(aggregations)
    return tabs.map((t) => {
      const resourceTypes =
        t.resource_type.length === 0
          ? Object.values(ResourceTypeEnum)
          : t.resource_type
      const count = counts
        ? resourceTypes
            .map((rt) => counts[rt] ?? 0)
            .reduce((acc, c) => acc + c, 0)
        : null
      return { ...t, label: appendCount(t.label, count) }
    })
  }, [tabs, aggregations])
  return (
    <TabsList
      className={className}
      onChange={(_e, value) => {
        const tab = tabs.find((t) => t.name === value)
        if (!tab) return
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          if (tab.defaultTab) {
            next.delete("tab")
          } else {
            next.set("tab", value)
          }
          return next
        })
        onTabChange?.()
      }}
    >
      {withCounts.map((t) => {
        return <TabButton key={t.name} value={t.name} label={t.label} />
      })}
    </TabsList>
  )
}

const ResourceTypeTabPanels: React.FC<{
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
 * Components for a tabbed search UI with tabs controlling resource_type facet.
 *
 * Intended usage is:
 * ```jsx
 * <ResourceTypeTabs.Context>
 *    <ResourceTypeTabs.TabList />
 *    <ResourceTypeTabPanels>
 *      Panel Content
 *    </ResourceTypeTabPanels>
 * <ResourceTypeTabs.Context>
 * ```
 *
 * These are exported as three separate components (Context, TabList, TabPanels)
 * to facilitate placement within a grid layout.
 */
const ResourceTypeTabs = {
  Context: ResourceTypesTabContext,
  TabList: ResourceTypeTabList,
  TabPanels: ResourceTypeTabPanels,
}

export { ResourceTypeTabs }
export type { TabConfig }

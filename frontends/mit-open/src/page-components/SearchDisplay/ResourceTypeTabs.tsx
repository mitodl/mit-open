import React from "react"
import {
  TabButton,
  TabContext,
  TabButtonList,
  TabPanel,
  styled,
} from "ol-components"
import type { ResourceTypeEnum, LearningResourceSearchResponse } from "api"

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
  resource_type: ResourceTypeEnum
  label: string
}

type Aggregations = LearningResourceSearchResponse["metadata"]["aggregations"]
const resourceTypeCounts = (aggregations?: Aggregations) => {
  if (!aggregations) return null
  const buckets = aggregations?.resource_type ?? []
  const counts = buckets.reduce(
    (acc, bucket) => {
      acc[bucket.key] = bucket.doc_count
      return acc
    },
    {} as Record<string, number>,
  )
  return counts
}
const appendCount = (label: string, count?: number) => {
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
  resourceType?: ResourceTypeEnum
  children: React.ReactNode
}> = ({ resourceType, children }) => {
  const tab = resourceType ?? "all"
  return <TabContext value={tab}>{children}</TabContext>
}

type ResourceTypeTabsProps = {
  aggregations?: Aggregations
  tabs: TabConfig[]
  patchParams: ({
    resource_type,
  }: {
    resource_type: ResourceTypeEnum[]
  }) => void
  onTabChange?: (tab: ResourceTypeEnum | "all") => void
  className?: string
}
const ResourceTypeTabList: React.FC<ResourceTypeTabsProps> = ({
  tabs,
  aggregations,
  patchParams,
  onTabChange,
  className,
}) => {
  const counts = resourceTypeCounts(aggregations)
  const allCount = counts
    ? tabs.reduce((acc, tab) => acc + (counts[tab.resource_type] ?? 0), 0)
    : undefined
  return (
    <TabsList
      className={className}
      onChange={(_e, value) => {
        patchParams({ resource_type: value === "all" ? [] : [value] })
        onTabChange?.(value)
      }}
    >
      <TabButton value="all" label={appendCount("All", allCount)} />
      {tabs.map((t) => {
        const count = counts ? counts[t.resource_type] ?? 0 : undefined
        return (
          <TabButton
            key={t.resource_type}
            value={t.resource_type}
            label={appendCount(t.label, count)}
          />
        )
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
      <TabPanel value="all">{children}</TabPanel>
      {tabs.map((t) => (
        <TabPanel key={t.resource_type} value={t.resource_type}>
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

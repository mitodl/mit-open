import React from "react"
import { Tab, TabContext, TabList, TabPanel } from "ol-components"
import type { ResourceTypeEnum, LearningResourceSearchResponse } from "api"
import type { UseSearchQueryParamsResult } from "@mitodl/course-search-utils"

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
    return `${label} (${count})`
  }
  return label
}

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
  setFacetActive: UseSearchQueryParamsResult["setFacetActive"]
  clearFacet: UseSearchQueryParamsResult["clearFacet"]
  onTabChange?: (tab: ResourceTypeEnum | "all") => void
}
const ResourceTypeTabList: React.FC<ResourceTypeTabsProps> = ({
  tabs,
  aggregations,
  setFacetActive,
  clearFacet,
  onTabChange,
}) => {
  const counts = resourceTypeCounts(aggregations)
  const allCount = counts
    ? tabs.reduce((acc, tab) => acc + (counts[tab.resource_type] ?? 0), 0)
    : undefined
  return (
    <TabList
      onChange={(_e, value) => {
        clearFacet("resource_type")
        if (value !== "all") {
          setFacetActive("resource_type", value, true)
        }
        onTabChange?.(value)
      }}
    >
      <Tab value="all" label={appendCount("All", allCount)} />
      {tabs.map((t) => {
        const count = counts ? counts[t.resource_type] ?? 0 : undefined
        return (
          <Tab
            key={t.resource_type}
            value={t.resource_type}
            label={appendCount(t.label, count)}
          />
        )
      })}
    </TabList>
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

export { ResourceTypesTabContext, ResourceTypeTabList, ResourceTypeTabPanels }
export type { TabConfig }

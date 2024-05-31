import React, { useMemo } from "react"
import { styled, Typography, Box } from "ol-components"
import { capitalize } from "ol-utilities"
import { ChannelTypeEnum, FieldChannel } from "api/v0"

type ChannelDetailsProps = {
  field: FieldChannel
}

const FACETS_BY_CHANNEL_TYPE: Record<ChannelTypeEnum, string[]> = {
  [ChannelTypeEnum.Topic]: [
    "free",
    "department",
    "offered_by",
    "learning_format",
  ],
  [ChannelTypeEnum.Department]: [
    "free",
    "topic",
    "offered_by",
    "learning_format",
  ],
  [ChannelTypeEnum.Offeror]: [
    "offerings",
    "audience",
    "formats",
    "content_types",
    "certifications",
    "more_information",
  ],
  [ChannelTypeEnum.Pathway]: [],
}

const getFacetManifest = (channelType: ChannelTypeEnum): FacetManifest => {
  return [
    {
      type: "group",
      facets: [
        {
          name: "free",
          label: "Free",
        },
      ],
      name: "free",
    },
    {
      name: "topic",
      title: "Topic",
    },
    {
      name: "formats",
      title: "Formats",
    },
    {
      name: "fee",
      title: "Fee",
    },
    {
      name: "department",
      title: "Department",
    },
    {
      name: "offerings",
      title: "Offerings",
    },
    {
      name: "level",
      title: "Level",
    },
    {
      name: "content_types",
      title: "Type of Content",
    },
    {
      name: "audience",
      title: "Audience",
    },
    {
      name: "more_information",
      title: "More Information",
    },
    {
      name: "platform",
      title: "Platform",
    },
    {
      name: "offered_by",
      title: "Offered By",
    },
    {
      name: "certifications",
      title: "Certificate",
    },
    {
      name: "learning_format",
      title: "Format",
      labelFunction: (key: string) =>
        key
          .split("_")
          .map((word) => capitalize(word))
          .join("-"),
    },
  ].filter((facetSetting) =>
    (FACETS_BY_CHANNEL_TYPE[channelType] || []).includes(facetSetting.name),
  ) as FacetManifest
}

const getChannelDetails = (field) => {
  const channelType = field.channel_type
  const dataKey = `${channelType}_detail`
  return field[dataKey][channelType]
}

const ChannelDetailsCard = styled(Box)<{ theme }>({
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "16px",
  backgroundColor: "white",
  width: "300px",
  fontSize: "0.5em",
  lineHeight: "0.5em",
})

const ChannelDetails: React.FC<ChannelDetailsProps> = (props) => {
  const { field } = props
  console.log("FIELD", field)
  console.log("FIELD", field.channel_type)
  const channelDetails = getChannelDetails(field)
  const channelType = field.channel_type

  const facetManifest = useMemo(
    () => getFacetManifest(channelType),
    [channelType],
  )

  const facetNames = Array.from(
    new Set(
      facetManifest.flatMap((facet) => {
        if (facet.type === "group") {
          return facet.facets.map((subfacet) => subfacet.name)
        } else {
          return [facet.name]
        }
      }),
    ),
  )
  console.log("facetNames", facetNames)
  console.log("facetManifest", facetManifest)

  const body = facetManifest.map((value) => {
    const label = value.labelFunction
      ? value.labelFunction(value.name)
      : channelDetails[value.name]

    return (
      <Box key={value.title} sx={{ margin: "10px" }}>
        <Typography
          lineHeight="1"
          fontSize="inherit"
          variant="h5"
          component="h5"
          gutterBottom
        >
          {value.title}
        </Typography>
        <Typography
          lineHeight="1"
          fontSize="inherit"
          variant="body1"
          color="text.secondary"
          gutterBottom
        >
          {Array.isArray(label) ? label.join(" | ") : label}
        </Typography>
      </Box>
    )
  })
  console.log("testing 2", body)
  return <ChannelDetailsCard>{body}</ChannelDetailsCard>
}

export { ChannelDetails }
export type { ChannelDetailsProps }

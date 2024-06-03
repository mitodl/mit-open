import React, { useMemo } from "react"
import { styled, Typography, Box } from "ol-components"
import { capitalize } from "ol-utilities"
import { ChannelTypeEnum, FieldChannel } from "api/v0"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"

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

const getFacetManifest = (channelType: ChannelTypeEnum) => {
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
      labelFunction: (key: string, channelTitle: string) => (
        <a href={key}>
          {channelTitle} website <OpenInNewIcon fontSize="inherit" />
        </a>
      ),
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
  )
}

const getChannelDetails = (field: FieldChannel) => {
  const channelType = field.channel_type
  const dataKey = `${channelType}_detail`
  const fieldData = field as Record<string, string[] | string>
  return fieldData[dataKey][channelType]
}
const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.custom.colors.mitRed,
}))
const ChannelDetailsCard = styled(Box)({
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
  const channelDetails = getChannelDetails(field)
  const channelType = field.channel_type
  const channelTitle = field.title
  const facetManifest = useMemo(
    () => getFacetManifest(channelType),
    [channelType],
  )

  const body = facetManifest.map((value) => {
    if (channelDetails[value.name]) {
      const label = value?.labelFunction
        ? value.labelFunction(channelDetails[value.name], channelTitle)
        : channelDetails[value.name]

      return (
        <Box key={value.title} sx={{ margin: "10px" }}>
          <InfoLabel
            lineHeight="1.5"
            fontSize="inherit"
            variant="h5"
            gutterBottom
          >
            {value.title}:
          </InfoLabel>
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
    }
    return <></>
  })
  return <ChannelDetailsCard>{body}</ChannelDetailsCard>
}

export { ChannelDetails }
export type { ChannelDetailsProps }

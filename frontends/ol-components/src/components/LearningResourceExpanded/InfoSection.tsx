import React from "react"
import styled from "@emotion/styled"
import ISO6391 from "iso-639-1"
import {
  RemixiconComponentType,
  RiMoneyDollarCircleFill,
  RiBarChartFill,
  RiGraduationCapFill,
  RiGlobalLine,
} from "@remixicon/react"
import {
  LearningResource,
  LearningResourceRun,
  ResourceTypeEnum,
  PlatformEnum,
} from "api"
import { theme } from "../ThemeProvider/ThemeProvider"
import Typography from "@mui/material/Typography"

const InfoItems = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const InfoItemContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.silverGrayDark};

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`

const InfoLabel = styled.div`
  width: 85px;
  flex-shrink: 0;
`

const InfoValue = styled.div`
  ${{ ...theme.typography.body2 }}
  color: ${theme.custom.colors.black};
`

type InfoSelector = (
  resource: LearningResource,
  run?: LearningResourceRun,
) => string | null

type InfoMap = Record<
  ResourceTypeEnum,
  { label: string; Icon: RemixiconComponentType; selector: InfoSelector }[]
>

const InfoTypeEnum = {
  Price: "price",
  Level: "level",
  Instructors: "instructors",
  Languages: "languages",
  Duration: "duration",
}

const INFO_TYPES = {
  [InfoTypeEnum.Price]: {
    label: "Price",
    Icon: RiMoneyDollarCircleFill,
    selector: (resource: LearningResource, run?: LearningResourceRun) => {
      if (!resource || !run) {
        return null
      }
      const price = run.prices?.[0]
      if (
        resource.platform?.code === PlatformEnum.Ocw ||
        parseFloat(price!) === 0
      ) {
        return "Free"
      }
      return price ? `$${price}` : null
    },
  },

  [InfoTypeEnum.Level]: {
    label: "Level",
    Icon: RiBarChartFill,
    selector: (resource: LearningResource, run?: LearningResourceRun) => {
      return run?.level?.[0]?.name || null
    },
  },

  [InfoTypeEnum.Instructors]: {
    label: "Instructors",
    Icon: RiGraduationCapFill,
    selector: (resource: LearningResource, run?: LearningResourceRun) => {
      return (
        run?.instructors
          ?.filter((instructor) => instructor.full_name)
          .map(({ full_name: name }) => name)
          .join(", ") || null
      )
    },
  },

  [InfoTypeEnum.Languages]: {
    label: "Languages",
    Icon: RiGlobalLine,
    selector: (resource: LearningResource, run?: LearningResourceRun) => {
      return run?.languages?.length
        ? run.languages
            .map((language) => ISO6391.getName(language.substring(0, 2)))
            .join(", ")
        : null
    },
  },

  [InfoTypeEnum.Duration]: {
    label: "Duration",
    Icon: RiGlobalLine,
    selector: (resource: LearningResource) => {
      if (resource.resource_type === ResourceTypeEnum.Video) {
        return resource.video.duration || null
      }
      if (resource.resource_type === ResourceTypeEnum.PodcastEpisode) {
        return resource.podcast_episode.duration || null
      }
      return null
    },
  },
}

const INFO_MAP: InfoMap = {
  [ResourceTypeEnum.Course]: [
    INFO_TYPES[InfoTypeEnum.Price],
    INFO_TYPES[InfoTypeEnum.Level],
    INFO_TYPES[InfoTypeEnum.Instructors],
    INFO_TYPES[InfoTypeEnum.Languages],
  ],
  [ResourceTypeEnum.Program]: [
    INFO_TYPES[InfoTypeEnum.Price],
    INFO_TYPES[InfoTypeEnum.Level],
    INFO_TYPES[InfoTypeEnum.Instructors],
    INFO_TYPES[InfoTypeEnum.Languages],
  ],
  [ResourceTypeEnum.Video]: [INFO_TYPES[InfoTypeEnum.Duration]],
  [ResourceTypeEnum.PodcastEpisode]: [],
  [ResourceTypeEnum.Podcast]: [INFO_TYPES[InfoTypeEnum.Duration]],
  [ResourceTypeEnum.VideoPlaylist]: [],
  [ResourceTypeEnum.LearningPath]: [],
}

type InfoItemProps = {
  label: string
  Icon: RemixiconComponentType
  value: string | null
}

const InfoItem = ({ label, Icon, value }: InfoItemProps) => {
  if (!value) {
    return null
  }
  return (
    <InfoItemContainer>
      <Icon />
      <InfoLabel>{label}</InfoLabel>
      <InfoValue>{value}</InfoValue>
    </InfoItemContainer>
  )
}

const InfoSection = ({
  resource,
  run,
}: {
  resource?: LearningResource
  run?: LearningResourceRun
}) => {
  if (!resource || !run) {
    return null
  }

  const infoItems = INFO_MAP[resource.resource_type as ResourceTypeEnum]
    .map(({ label, Icon, selector }) => ({
      label,
      Icon,
      value: selector(resource, run),
    }))
    .filter(({ value }) => !!value)

  if (infoItems.length === 0) {
    return null
  }

  return (
    <InfoItems>
      <Typography variant="subtitle2" component="h3">
        Info
      </Typography>
      {infoItems.map((props, index) => (
        <InfoItem key={index} {...props} />
      ))}
    </InfoItems>
  )
}

export default InfoSection

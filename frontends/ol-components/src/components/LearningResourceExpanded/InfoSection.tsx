import React from "react"
import styled from "@emotion/styled"
import ISO6391 from "iso-639-1"
import {
  RemixiconComponentType,
  RiVerifiedBadgeLine,
  RiTimeLine,
  RiCalendarLine,
  RiListOrdered2,
  RiPriceTag3Line,
  RiDashboard3Line,
  RiGraduationCapLine,
  RiTranslate2,
} from "@remixicon/react"
import {
  LearningResource,
  LearningResourceRun,
  ResourceTypeEnum,
  PlatformEnum,
} from "api"
import { formatDurationClockTime } from "ol-utilities"
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
) => string | number | null

type InfoItemConfig = {
  label: string
  Icon: RemixiconComponentType
  selector: InfoSelector
}[]

const INFO_ITEMS: InfoItemConfig = [
  {
    label: "Price:",
    Icon: RiPriceTag3Line,
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

  {
    label: "Level:",
    Icon: RiDashboard3Line,
    selector: (resource: LearningResource, run?: LearningResourceRun) => {
      return run?.level?.[0]?.name || null
    },
  },

  {
    label: "Instructors:",
    Icon: RiGraduationCapLine,
    selector: (resource: LearningResource, run?: LearningResourceRun) => {
      return (
        run?.instructors
          ?.filter((instructor) => instructor.full_name)
          .map(({ full_name: name }) => name)
          .join(", ") || null
      )
    },
  },

  {
    label: "Languages:",
    Icon: RiTranslate2,
    selector: (resource: LearningResource, run?: LearningResourceRun) => {
      return run?.languages?.length
        ? run.languages
            .map((language) => ISO6391.getName(language.substring(0, 2)))
            .join(", ")
        : null
    },
  },

  {
    label: "Duration:",
    Icon: RiTimeLine,
    selector: (resource: LearningResource) => {
      if (resource.resource_type === ResourceTypeEnum.Video) {
        return resource.video.duration
          ? formatDurationClockTime(resource.video.duration)
          : null
      }
      if (resource.resource_type === ResourceTypeEnum.PodcastEpisode) {
        return resource.podcast_episode.duration || null
      }
      return null
    },
  },

  {
    label: "Offered By:",
    Icon: RiVerifiedBadgeLine,
    selector: (resource: LearningResource) => {
      return resource.offered_by?.name || null
    },
  },

  {
    label: "Date Posted:",
    Icon: RiCalendarLine,
    selector: () => {
      // TODO Not seeing any value for this in the API schema for VideoResource. Last modified date is closest available, though likely relates to the data record
      return null
    },
  },

  {
    label: "Number of Courses:",
    Icon: RiListOrdered2,
    selector: (resource: LearningResource) => {
      if (resource.resource_type === ResourceTypeEnum.Program) {
        return resource.program?.courses?.length || null
      }
      return null
    },
  },
]

type InfoItemProps = {
  label: string
  Icon: RemixiconComponentType
  value: string | number | null
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
  if (!resource) {
    return null
  }

  const infoItems = INFO_ITEMS.map(({ label, Icon, selector }) => ({
    label,
    Icon,
    value: selector(resource, run),
  })).filter(({ value }) => value !== null && value !== "")

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

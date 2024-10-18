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
  RiAwardLine,
  RiPresentationLine,
} from "@remixicon/react"
import { LearningResource, LearningResourceRun, ResourceTypeEnum } from "api"
import {
  formatDurationClockTime,
  getLearningResourcePrices,
} from "ol-utilities"
import { theme } from "../ThemeProvider/ThemeProvider"

const SeparatorContainer = styled.span({
  color: theme.custom.colors.silverGray,
})

const Separator: React.FC = () => (
  <SeparatorContainer>&nbsp;|&nbsp;</SeparatorContainer>
)

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
  ${{ ...theme.typography.subtitle3 }}
  color: ${theme.custom.colors.black};

  svg {
    color: ${theme.custom.colors.silverGrayDark};
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
  ${{ ...theme.typography.body3 }}
  color: ${theme.custom.colors.darkGray2};
  flex-grow: 1;
`

const PriceDisplay = styled.div({
  display: "flex",
  alignItems: "center",
  gap: "8px",
})

const Certificate = styled.div`
  display: flex;
  gap: 4px;
  border-radius: 4px;
  padding: 4px 8px;
  border: 1px solid ${theme.custom.colors.lightGray2};
  background-color: ${theme.custom.colors.lightGray1};
  color: ${theme.custom.colors.silverGrayDark};

  ${{ ...theme.typography.subtitle3 }}

  svg {
    width: 16px;
    height: 16px;
  }
`

const CertificatePrice = styled.span`
  ${{ ...theme.typography.body2 }}
`

type InfoSelector = (
  resource: LearningResource,
  run?: LearningResourceRun,
) => React.ReactNode

type InfoItemConfig = {
  label: string
  Icon: RemixiconComponentType | null
  selector: InfoSelector
}[]

const INFO_ITEMS: InfoItemConfig = [
  {
    label: "Price:",
    Icon: RiPriceTag3Line,
    selector: (resource: LearningResource) => {
      const prices = getLearningResourcePrices(resource)

      return (
        <PriceDisplay>
          <div>{prices.course.display}</div>
          {resource.certification && (
            <Certificate>
              <RiAwardLine />
              {prices.certificate.display
                ? "Earn a certificate:"
                : "Certificate included"}
              <CertificatePrice>{prices.certificate.display}</CertificatePrice>
            </Certificate>
          )}
        </PriceDisplay>
      )
    },
  },
  {
    label: "Topics:",
    Icon: RiPresentationLine,
    selector: (resource: LearningResource) => {
      const { topics } = resource
      if (!topics?.length) {
        return null
      }

      return topics.map((topic, index) => {
        return (
          <React.Fragment key={`topic-${index}`}>
            {topic.name}
            {index < topics.length - 1 && <Separator />}
          </React.Fragment>
        )
      })
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
        return resource.podcast_episode.duration
          ? formatDurationClockTime(resource.podcast_episode.duration)
          : null
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
        return resource.program.course_count
      }
      return null
    },
  },
]

type InfoItemProps = {
  label: string
  Icon: RemixiconComponentType | null
  value: React.ReactNode
}

const InfoItem = ({ label, Icon, value }: InfoItemProps) => {
  if (!value) {
    return null
  }
  return (
    <InfoItemContainer>
      {Icon && <Icon />}
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
      {infoItems.map((props, index) => (
        <InfoItem key={index} {...props} />
      ))}
    </InfoItems>
  )
}

export default InfoSection

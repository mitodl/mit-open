import React from "react"

import { ActionButton, styled, theme } from "ol-components"
import { useTestimonialList } from "api/hooks/testimonials"
import { Attestation } from "api/v0"
import { RiArrowRightLine, RiArrowLeftLine } from "@remixicon/react"
import Slider from "react-slick"

type TestimonialDisplayProps = {
  channels?: number[]
  offerors?: string[]
}

type InternalTestimonialDisplayProps = {
  attestation: Attestation
}

const QuoteContainer = styled.section(({ theme }) => ({
  backgroundColor: theme.custom.colors.darkGray2,
  color: theme.custom.colors.white,
  overflow: "auto",
  padding: "16px 0 24px 0",
}))

const QuoteBlock = styled.div(() => ({
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  maxWidth: "1328px",
  margin: "0 auto",
  padding: "0 22px",
}))

const QuoteLeader = styled.div(({ theme }) => ({
  width: "100%",
  height: "32px",
  fontSize: "60px",
  lineHeight: "60px",
  color: theme.custom.colors.silverGray,
}))

const QuoteBody = styled.div(({ theme }) => ({
  width: "100%",
  display: "flex",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}))

const AttestationBlock = styled.div(({ theme }) => ({
  width: "auto",
  flexGrow: "5",
  ...theme.typography.h5,
  justifyContent: "top",
}))

const AttestantBlock = styled.div(({ theme }) => ({
  width: "248px",
  display: "flex",
  [theme.breakpoints.down("md")]: {
    marginTop: "24px",
  },
}))

const AttestantAvatar = styled.div({
  marginRight: "12px",
  img: {
    objectFit: "cover",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    boxShadow:
      "0px 2px 4px 0px rgba(37, 38, 43, 0.10), 0px 2px 4px 0px rgba(37, 38, 43, 0.10)",
  },
})

const AttestantNameBlock = styled.div(({ theme }) => ({
  flexGrow: "1",
  width: "auto",
  color: theme.custom.colors.lightGray2,
}))

const AttestantName = styled.div(({ theme }) => ({
  ...theme.typography.subtitle1,
  whiteSpace: "nowrap",
  color: theme.custom.colors.white,
  lineHeight: "125%",
}))

const ButtonsContainer = styled.div(({ theme }) => ({
  display: "flex",
  justifyContent: "right",
  margin: "4px auto 0",
  gap: "16px",
  [theme.breakpoints.down("md")]: {
    marginTop: "16px",
  },
}))

const NoButtonsContainer = styled(ButtonsContainer)({
  height: "32px",
  margin: "0 auto",
})

const InteriorTestimonialDisplay: React.FC<InternalTestimonialDisplayProps> = ({
  attestation,
}) => {
  return (
    <QuoteBody>
      <AttestationBlock>{attestation?.quote}</AttestationBlock>
      <AttestantBlock>
        <AttestantAvatar>
          <img src={attestation.avatar_medium} />
        </AttestantAvatar>
        <AttestantNameBlock>
          <AttestantName>{attestation?.attestant_name}</AttestantName>
          {attestation.title}
        </AttestantNameBlock>
      </AttestantBlock>
    </QuoteBody>
  )
}

const TestimonialDisplay: React.FC<TestimonialDisplayProps> = ({
  channels,
  offerors,
}) => {
  const { data } = useTestimonialList({
    channels: channels,
    offerors: offerors,
  })
  const [slick, setSlick] = React.useState<Slider | null>(null)
  const responsive = [
    {
      breakpoint: theme.breakpoints.values["md"],
      settings: {
        adaptiveHeight: true,
      },
    },
  ]

  if (!data) return null
  if (data.results.length === 0) return null

  return (
    <QuoteContainer>
      <QuoteBlock>
        <QuoteLeader>“</QuoteLeader>
        {data.count > 1 ? (
          <>
            <Slider
              ref={setSlick}
              infinite={true}
              slidesToShow={1}
              arrows={false}
              centerMode={false}
              responsive={responsive}
            >
              {data?.results.map((attestation) => (
                <InteriorTestimonialDisplay
                  key={`testimonial-${attestation.id}`}
                  attestation={attestation}
                ></InteriorTestimonialDisplay>
              ))}
            </Slider>
            <ButtonsContainer>
              <ActionButton
                size="small"
                variant="tertiary"
                onClick={slick?.slickPrev}
              >
                <RiArrowLeftLine />
              </ActionButton>
              <ActionButton
                size="small"
                variant="tertiary"
                onClick={slick?.slickNext}
              >
                <RiArrowRightLine />
              </ActionButton>
            </ButtonsContainer>
          </>
        ) : (
          <>
            <InteriorTestimonialDisplay
              key={`testimonial-${data["results"][0].id}`}
              attestation={data["results"][0]}
            ></InteriorTestimonialDisplay>
            <NoButtonsContainer></NoButtonsContainer>
          </>
        )}
      </QuoteBlock>
    </QuoteContainer>
  )
}

export default TestimonialDisplay

import React from "react"
import {
  Container,
  Typography,
  styled,
  theme,
  Carousel,
  pxToRem,
} from "ol-components"
import { useTestimonialList } from "api/hooks/testimonials"
import { Attestation } from "api/v0"
import { RiArrowDropRightLine, RiArrowDropLeftLine } from "@remixicon/react"

const testimonialsTheme = {
  ...theme,
  custom: {
    ...theme.custom,
    quoteLeader: {
      fontSize: pxToRem(80),
      lineHeight: pxToRem(120),
    },
  },
}

const Section = styled.section(({ theme }) => ({
  backgroundColor: theme.custom.colors.mitRed,
  color: theme.custom.colors.white,
  overflow: "auto",
  padding: "80px 0",
  [theme.breakpoints.down("md")]: {
    padding: "40px 0",
  },
  ["h2, h3"]: {
    textAlign: "center",
  },
  ["h3"]: {
    marginTop: "8px",
    marginBottom: "60px",
    ...theme.typography.body1,
  },
}))

type TestimonialsDataCarouselProps = {
  children: ({
    resources,
    isLoading,
  }: {
    resources: Attestation[]
    isLoading: boolean
  }) => React.ReactNode
}

const TestimonialsDataCarousel: React.FC<TestimonialsDataCarouselProps> = ({
  children,
}) => {
  const { data, isLoading } = useTestimonialList()
  return children({ resources: data?.results ?? [], isLoading })
}

const TestimonialsDataCarouselStyled = styled(TestimonialsDataCarousel)({
  width: "948px",
  height: "416px",
})

const TestimonialsCarouselStyled = styled(Carousel)({
  [".nuka-overflow"]: {
    width: "auto",
  },
  [".nuka-wrapper"]: {
    margin: "0 120px",
  },
  [".nuka-wrapper .testimonial-card:last-child"]: {
    marginRight: "474px",
  },
})

const TestimonialCard = styled.div({
  minWidth: "948px",
  maxWidth: "948px",
  height: "326px",
  backgroundColor: theme.custom.colors.white,
  color: theme.custom.colors.black,
  display: "flex",
  borderRadius: "8px",
  margin: "0 0 26px 24px",
})

const TestimonialCardImage = styled.div({
  width: "300px",
  height: "326px",
  ["img"]: {
    width: "300px",
    height: "326px",
    objectFit: "cover",
    borderTopLeftRadius: "8px",
    borderBottomLeftRadius: "8px",
  },
})

const TestimonialCardQuote = styled.div({
  width: "648px",
  height: "326px",
  backgroundColor: theme.custom.colors.white,
  color: theme.custom.colors.black,
  padding: "0 32px 32px",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flex: "1 0 0",
  alignSelf: "stretch",
  borderRadius: "8px",
  display: "flex",

  ["div.testimonial-quote-opener"]: {
    color: theme.custom.colors.mitRed,
    fontStyle: "normal",
    height: "70px",
    width: "100%",
    ...testimonialsTheme.custom.quoteLeader,
  },

  ["h4"]: {
    flexGrow: "1",
  },

  ["div.testimonial-quote-closer"]: {
    textAlign: "right",
    width: "100%",
  },
})

const TestimonialFadeRight = styled.div({
  width: "246px",
  height: "414px",
  position: "absolute",
  right: "0",
  bottom: "0",
  background:
    "linear-gradient(90deg,rgb(117 0 20 / 0%) 0%,rgb(117 0 20 / 95%) 100%)",
})

const TestimonialFadeLeft = styled.div({
  width: "246px",
  height: "414px",
  position: "absolute",
  left: "0",
  background:
    "linear-gradient(270deg,rgb(117 0 20 / 0%) 0%,rgb(117 0 20 / 95%) 100%)",
})

const TestimonialsSection: React.FC = () => {
  return (
    <Section>
      <Container id="hamster-noises">
        <Typography variant="h2">From our Community</Typography>
        <Typography variant="h3">
          Here's what other subscribers had to say about MIT Open
        </Typography>
        <TestimonialsDataCarouselStyled>
          {({ resources }) => (
            <>
              <TestimonialsCarouselStyled
                pageSize={1}
                pageLeftIcon={<RiArrowDropLeftLine />}
                pageRightIcon={<RiArrowDropRightLine />}
                buttonAlignment="center"
                buttonVariant="inverted"
                buttonSize="large"
                wrapMode="wrap"
                scrollDistance={948}
              >
                <TestimonialFadeLeft />
                {resources.map((resource) => (
                  <TestimonialCard
                    key={`a-${resource.id}`}
                    id={`testimonial-card-${resource.id}`}
                    className="testimonial-card"
                  >
                    <TestimonialCardImage>
                      <img src={resource.avatar} />
                    </TestimonialCardImage>
                    <TestimonialCardQuote>
                      <div className="testimonial-quote-opener">&ldquo;</div>
                      <Typography variant="h4">{resource.quote}</Typography>
                      <div className="testimonial-quote-closer">
                        <Typography variant="h5">
                          {resource.attestant_name}
                        </Typography>
                        {resource.title}
                      </div>
                    </TestimonialCardQuote>
                  </TestimonialCard>
                ))}
                <TestimonialFadeRight />
              </TestimonialsCarouselStyled>
            </>
          )}
        </TestimonialsDataCarouselStyled>
      </Container>
    </Section>
  )
}

export default TestimonialsSection

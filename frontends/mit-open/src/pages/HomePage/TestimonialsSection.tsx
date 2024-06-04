import React from "react"
import { Container, Typography, styled, theme, pxToRem } from "ol-components"
import { useTestimonialList } from "api/hooks/testimonials"
import { RiArrowDropRightLine, RiArrowDropLeftLine } from "@remixicon/react"
import useEmblaCarousel from "embla-carousel-react"

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

const TestimonialCardContainer = styled.div({
  flex: "0 0 50%",
  marginLeft: "28px",
  backgroundColor: theme.custom.colors.white,
})

const TestimonialCard = styled.div({
  height: "326px",

  color: theme.custom.colors.black,
  display: "flex",
  borderRadius: "8px",
  [theme.breakpoints.down("md")]: {
    height: "411px",
    flexDirection: "column",
    margin: "0",
  },
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
    [theme.breakpoints.down("md")]: {
      width: "100%",
      height: "190px",
      borderTopRightRadius: "8px",
      borderBottomLeftRaidus: "0",
    },
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    height: "190px",
    borderRadius: "8px 0 8px 0",
    backgroundColor: theme.custom.colors.darkBlue,
  },
})

const TestimonialCardQuote = styled.div({
  width: "648px",
  height: "326px",
  color: theme.custom.colors.black,
  padding: "0 32px 32px",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flex: "1 0 0",
  alignSelf: "stretch",
  borderRadius: "8px",
  display: "flex",
  [theme.breakpoints.down("md")]: {
    width: "100%",
    height: "161px",
    borderRadius: "0 8px 0 8px",
    marginTop: "16px",
    marginBottom: "16px",
    padding: "0 16px",
  },

  "div.testimonial-quote-opener": {
    color: theme.custom.colors.mitRed,
    fontStyle: "normal",
    height: pxToRem(80),
    width: "100%",
    fontSize: pxToRem(80),
    lineHeight: pxToRem(120),
    [theme.breakpoints.down("md")]: {
      fontSize: pxToRem(80),
      height: pxToRem(50),
      lineHeight: "normal",
    },
  },

  ["h4"]: {
    flexGrow: "1",
    [theme.breakpoints.down("md")]: {
      width: "100%",
      ...theme.typography.subtitle1,
    },
  },

  ["div.testimonial-quote-closer"]: {
    textAlign: "right",
    width: "100%",
  },
})

const Embla = styled.div({
  maxWidth: "100%",
  margin: "auto",
  "--slide-spacing": "1rem",
  "--slide-size": "50%",
})
const EmblaViewport = styled.div({
  overflow: "hidden",
})
const EmblaContainer = styled.div({
  display: "flex",
  backfaceVisibility: "hidden",
  touchAction: "pan-y pinch-zoom",
  marginLeft: "calc(var(--slide-spacing) * -1)",
})
const EmblaCarousel = ({}) => {
  const [viewportRef, embla] = useEmblaCarousel({ loop: true })
  const { data, isLoading } = useTestimonialList()
  if (!data) return null
  return (
    <Embla>
      <EmblaViewport ref={viewportRef}>
        <EmblaContainer>
          {data?.results.map((resource) => (
            <TestimonialCardContainer key={`container-${resource.id}`}>
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
            </TestimonialCardContainer>
          ))}
        </EmblaContainer>
      </EmblaViewport>
    </Embla>
  )
}

const TestimonialsSection: React.FC = () => {
  return (
    <Section>
      <Container>
        <Typography variant="h2">From our Community</Typography>
        <Typography variant="h3">
          Here's what other subscribers had to say about MIT Open
        </Typography>
        <EmblaCarousel />
      </Container>
    </Section>
  )
}

export default TestimonialsSection

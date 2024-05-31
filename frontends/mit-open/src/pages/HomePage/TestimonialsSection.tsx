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
  [theme.breakpoints.down("md")]: {
    width: "311px",
    height: "659px",
    margin: "0 auto",
  },
})

const TestimonialsCarouselStyled = styled(Carousel)({
  [theme.breakpoints.down("md")]: {
    width: "100%",
    height: "483px",
    [".nuka-slide-container"]: {
      transform: "translateX(0)",
    },
  },
  [".nuka-overflow"]: {
    margin: "0 auto",
    [theme.breakpoints.down("md")]: {
      width: "311px",
    },
  },
  [".nuka-wrapper"]: {
    width: "948px",
    margin: "0 auto",
    [theme.breakpoints.down("md")]: {
      width: "311px",
    },
  },
})

const TestimonialCardContainer = styled.div({
  minWidth: "948px",
  maxWidth: "948px",
  margin: "0 0 26px 24px",
  ["&:first"]: {
    marginLeft: "0",
  },
  ["&:last"]: {
    marginRight: "0",
  },
  [theme.breakpoints.down("md")]: {
    minWidth: "311px",
    maxWidth: "311px",
    margin: "0",
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
  [theme.breakpoints.down("md")]: {
    minWidth: "311px",
    maxWidth: "311px",
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
  [theme.breakpoints.down("md")]: {
    width: "100%",
    height: "161px",
    borderRadius: "0 8px 0 8px",
    marginTop: "16px",
    marginBottom: "16px",
    padding: "0 16px",
  },

  ["div.testimonial-quote-opener"]: {
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

const TestimonialFadeRight = styled.div({
  width: "972px",
  height: "414px",
  position: "absolute",
  right: "0",
  bottom: "0",
  ["div"]: {
    marginLeft: "auto",
    height: "414px",
    width: "246px",
    background:
      "linear-gradient(90deg,rgb(117 0 20 / 0%) 0%,rgb(117 0 20 / 95%) 100%)",
  },
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
})

const TestimonialFadeLeft = styled.div({
  width: "972px",
  height: "414px",
  position: "absolute",
  left: "0",
  ["div"]: {
    height: "414px",
    width: "246px",
    background:
      "linear-gradient(270deg,rgb(117 0 20 / 0%) 0%,rgb(117 0 20 / 95%) 100%)",
  },
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
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
                scrollDistance={"slide"}
              >
                <TestimonialFadeLeft>
                  <div></div>
                </TestimonialFadeLeft>
                {resources.map((resource) => (
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
                <TestimonialFadeRight>
                  <div></div>
                </TestimonialFadeRight>
              </TestimonialsCarouselStyled>
            </>
          )}
        </TestimonialsDataCarouselStyled>
      </Container>
    </Section>
  )
}

export default TestimonialsSection

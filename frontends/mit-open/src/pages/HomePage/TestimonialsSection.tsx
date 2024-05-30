import React from "react"
import { Container, Typography, styled, theme, Carousel } from "ol-components"
import { pxToRem } from "../../../../ol-components/src/components/ThemeProvider/typography"
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

const Section = styled.section`
  background-color: ${theme.custom.colors.mitRed};
  color: ${theme.custom.colors.white};
  overflow: auto;
  padding: 80px 80px;
  ${({ theme }) => theme.breakpoints.down("md")} {
    padding: 40px 0;
  }
  h2,
  h3 {
    text-align: center;
  }
  h3 {
    margin-top: 8px;
    ${({ theme }) => theme.typography.body1}
    margin-bottom: 60px;
  }
`

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

const TestimonialsDataCarouselStyled = styled(TestimonialsDataCarousel)`
  width: 948px;
  height: 416px;
`

const TestimonialsCarouselStyled = styled(Carousel)`
  .nuka-overflow {
    width: auto;
  }
  .nuka-wrapper {
    margin: 0 120px;
  }
  .nuka-wrapper .testimonial-card:last-child {
    margin-right: 474px;
  }
`

const TestimonialCard = styled.div`
  min-width: 948px;
  max-width: 948px;
  height: 326px;
  background-color: ${theme.custom.colors.white};
  color: ${theme.custom.colors.black};
  display: flex;
  border-radius: 8px;
  margin: 0 0 26px 24px;
`

const TestimonialCardImage = styled.div`
  width: 300px;
  height: 326px;
  img {
    width: 300px;
    height: 326px;
    object-fit: cover;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }
`

const TestimonialCardQuote = styled.div`
  width: 648px;
  height: 326px;
  background-color: ${theme.custom.colors.white};
  color: ${theme.custom.colors.black};
  padding: 0 32px 32px 32px;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1 0 0;
  align-self: stretch;
  border-radius: 8px;
  display: flex;
  div.testimonial-quote-opener {
    color: ${theme.custom.colors.mitRed};
    font-style: normal;
    height: 70px;
    width: 100%;
    ${() => testimonialsTheme.custom.quoteLeader}
  }
  h4 {
    flex-grow: 1;
  }
  div.testimonial-quote-closer {
    text-align: right;
    width: 100%;
  }
`

const TestimonialFadeRight = styled.div`
  width: 246px;
  height: 414px;
  position: absolute;
  right: 0px;
  bottom: 0px;
  background: linear-gradient(
    90deg,
    rgba(117, 0, 20, 0) 0%,
    rgba(117, 0, 20, 0.95) 100%
  );
`

const TestimonialFadeLeft = styled.div`
  width: 246px;
  height: 414px;
  position: absolute;
  left: 0px;
  background: linear-gradient(
    270deg,
    rgba(117, 0, 20, 0) 0%,
    rgba(117, 0, 20, 0.95) 100%
  );
`

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

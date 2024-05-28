import React from "react"
import { Container, Typography, styled, theme, Carousel } from "ol-components"
import { useTestimonialList } from "api/hooks/testimonials"
import { Attestation } from "api/v0"
import { RiArrowDropRightLine, RiArrowDropLeftLine } from "@remixicon/react"

const Section = styled.section`
  background-color: ${theme.custom.colors.mitRed};
  color: ${theme.custom.colors.white};
  overflow: auto;
  padding: 80px 0;
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
  }
`

type TestimonialsCarouselProps = {
  children: ({
    resources,
    isLoading,
  }: {
    resources: Attestation[]
    isLoading: boolean
  }) => React.ReactNode
}

const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  children,
}) => {
  const { data, isLoading } = useTestimonialList()
  return children({ resources: data?.results ?? [], isLoading })
}

const TestimonialsSection: React.FC = () => {
  return (
    <Section>
      <Container>
        <Typography variant="h2">From our Community</Typography>
        <Typography variant="h3">
          Here's what other subscribers had to say about MIT Open
        </Typography>
        <TestimonialsCarousel>
          {({ resources }) => (
            <Carousel
              pageSize={1}
              pageLeftIcon={<RiArrowDropLeftLine />}
              pageRightIcon={<RiArrowDropRightLine />}
              buttonAlignment="center"
              buttonVariant="inverted"
              buttonSize="large"
            >
              {resources.map((resource) => (
                <div key={resource.id}>{resource.quote}</div>
              ))}
            </Carousel>
          )}
        </TestimonialsCarousel>
      </Container>
    </Section>
  )
}

export default TestimonialsSection

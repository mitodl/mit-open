import React from "react"
import {
  Breadcrumbs,
  Container,
  Typography,
  TypographyProps,
  styled,
} from "ol-components"
import EcommerceFeature from "@/page-components/EcommerceFeature/EcommerceFeature"
import MetaTags from "@/page-components/MetaTags/MetaTags"
import * as urls from "@/common/urls"

const PageContainer = styled.div(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  padding: "40px 84px 80px 84px",
  [theme.breakpoints.down("md")]: {
    padding: "40px 24px 80px 24px",
  },
}))

const BannerContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingBottom: "16px",
})

const BannerContainerInner = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  alignSelf: "stretch",
  justifyContent: "center",
})

const Header = styled(Typography)<Pick<TypographyProps, "component">>(
  ({ theme }) => ({
    alignSelf: "stretch",
    color: theme.custom.colors.black,
  }),
)

const BodyContainer = styled.div({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "stretch",
  gap: "20px",
})

const BodyText = styled(Typography)<Pick<TypographyProps, "component">>(
  ({ theme }) => ({
    alignSelf: "stretch",
    color: theme.custom.colors.black,
  }),
)

const CartPage: React.FC = () => {
  return (
    <EcommerceFeature>
      <Container>
        <PageContainer>
          <MetaTags title="Shopping Cart" />
          <BannerContainer>
            <BannerContainerInner>
              <Breadcrumbs
                variant="light"
                ancestors={[{ href: urls.HOME, label: "Home" }]}
                current="Shopping Cart"
              />
              <Header component="h1" variant="h3">
                Shopping Cart
              </Header>
            </BannerContainerInner>
          </BannerContainer>
          <BodyContainer>
            <BodyText component="h2" variant="h4">
              The shopping cart layout should go here, if you're allowed to see
              this.
            </BodyText>
          </BodyContainer>
        </PageContainer>
      </Container>
    </EcommerceFeature>
  )
}

export default CartPage

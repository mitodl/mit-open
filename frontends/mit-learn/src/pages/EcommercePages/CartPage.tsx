import React from "react"
import { Breadcrumbs, Card, Container, Typography, styled } from "ol-components"
import EcommerceFeature from "@/page-components/EcommerceFeature/EcommerceFeature"
import MetaTags from "@/page-components/MetaTags/MetaTags"
import * as urls from "@/common/urls"

const CartContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  [theme.breakpoints.down("md")]: {
    padding: "24px 16px",
    gap: "24px",
  },
}))

const CartItemsContainer = styled(Container)(() => ({
  width: "66%",
}))

const OrderSummaryContainer = styled(Container)(() => ({
  width: "33%",
}))

const ItemImg = styled.img`
  padding: 32px;
  padding-right: 0;
  width: 200px;
  height: auto;
`

const ItemDetails = styled.div`
  width: auto;
  flex-grow: 1;
  padding: 32px;
`

const ItemCard: React.FC = () => <>
  <ItemImg alt="placeholder" src="http://placecats.com/200/100" />
  <ItemDetails>
    <p>Item Type</p>
    <h3>Item Title</h3>

    <p>Item Details | Remove</p>
  </ItemDetails>
</>

const StyledItemCard = styled(ItemCard)(() => ({
  display: "flex",
  ["img"]: {
    padding: "32px",
    paddingRight: "0",
    width: "200px",
  }
}))

const CartPage: React.FC = () => {
  return (
    <EcommerceFeature>
      <Container>
        <MetaTags title="Shopping Cart" />
        <Breadcrumbs
          variant="light"
          ancestors={[{ href: urls.HOME, label: "Home" }]}
          current="Shopping Cart"
        />

        <Typography component="h1" variant="h3">
          Shopping Cart
        </Typography>

        <Typography component="h2">
          You are about to purchase the following:
        </Typography>

        <CartContainer>
          <CartItemsContainer>
            <StyledItemCard />
          </CartItemsContainer>

          <OrderSummaryContainer>
            <h2>Here's where the order summary should go.</h2>
          </OrderSummaryContainer>
        </CartContainer>
      </Container>
    </EcommerceFeature>
  )
}

export default CartPage

import React from "react"
import { Breadcrumbs, Container, Typography } from "ol-components"
import EcommerceFeature from "@/page-components/EcommerceFeature/EcommerceFeature"
import MetaTags from "@/page-components/MetaTags/MetaTags"
import * as urls from "@/common/urls"

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

        <Typography>
          The shopping cart layout should go here, if you're allowed to see
          this.
        </Typography>
      </Container>
    </EcommerceFeature>
  )
}

export default CartPage

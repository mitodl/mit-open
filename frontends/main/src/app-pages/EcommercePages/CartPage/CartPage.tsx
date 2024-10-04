"use client"
import React from "react"
import { Breadcrumbs, Container, Typography } from "ol-components"
import EcommerceFeature from "@/page-components/EcommerceFeature/EcommerceFeature"
import * as urls from "@/common/urls"

const CartPage: React.FC = () => {
  return (
    <EcommerceFeature>
      <Container>
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

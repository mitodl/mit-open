import React from "react"
import { Metadata } from "next"
import { standardizeMetadata } from "@/common/metadata"
import CartPage from "@/app-pages/EcommercePages/CartPage/CartPage"

export const metadata: Metadata = standardizeMetadata({
  title: "Shopping Cart",
})

const Page: React.FC = () => {
  return <CartPage />
}

export default Page

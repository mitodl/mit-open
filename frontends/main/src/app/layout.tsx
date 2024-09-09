"use client"

import React from "react"
import Header from "@/page-components/Header/Header"
import Footer from "@/page-components/Footer/Footer"
import { PageWrapper, PageWrapperInner } from "./styled"
import Providers from "./providers"
import { MITLearnGlobalStyles } from "ol-components"

import "./GlobalStyles"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <MITLearnGlobalStyles />
          <PageWrapper>
            <Header />
            <PageWrapperInner>{children}</PageWrapperInner>
            <Footer />
          </PageWrapper>
        </Providers>
      </body>
    </html>
  )
}

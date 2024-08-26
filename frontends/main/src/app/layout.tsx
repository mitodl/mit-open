
"use client"

import React, { Suspense } from "react"
import Header from "@/page-components/Header/Header"
import Footer from "@/page-components/Footer/Footer"
import {PageWrapper, PageWrapperInner} from "./styled"
import Providers from "./providers"
import GlobalStyles from "./GlobalStyles"

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body>
        <Providers>
          <GlobalStyles />

              <PageWrapper>
                {/* TODO Move the suspense boundary (required for useSearchParams) tighter around the UserMenu so the rest of the Header can render on the server */}
                <Suspense>
                  <Header />
                </Suspense>
                <PageWrapperInner>
                  { children }
                  {/* <Outlet /> */}
                </PageWrapperInner>
                <Footer />
              </PageWrapper>
        </Providers>
      </body>
    </html>
  );
}

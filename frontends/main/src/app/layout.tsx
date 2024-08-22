
"use client"

import React, { Suspense } from "react"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import Header from "@/page-components/Header/Header"
import Footer from "@/page-components/Footer/Footer"
import {PageWrapper, PageWrapperInner} from "./styled"
import { ThemeProvider } from "ol-components";
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
          <AppRouterCacheProvider>
            <ThemeProvider>
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
            </ThemeProvider>
          </AppRouterCacheProvider>
        </Providers>
      </body>
    </html>
  );
}

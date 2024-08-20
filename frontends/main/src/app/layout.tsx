'use client';

import React from "react"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
// import ResourceCarousel from "@/page-components/ResourceCarousel/ResourceCarousel"

import Header from "@/page-components/Header/Header"
import Footer from "@/page-components/Footer/Footer"
import LearningResourceDrawer from "@/page-components/LearningResourceDrawer/LearningResourceDrawer"
import {PageWrapper, PageWrapperInner} from "./styled"
import { ThemeProvider } from 'ol-components';
import Providers from './providers'
import GlobalStyles from "./GlobalStyles"

const metadata: Metadata = {
  title: "MIT Learn",
  description: "Learn With MIT",
};

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
                <Header />
                <PageWrapperInner>
                  { children }
                  {/* <Outlet /> */}
                  <LearningResourceDrawer />
                </PageWrapperInner>
                <Footer />
              </PageWrapper>
            </ThemeProvider>
          </AppRouterCacheProvider>
          </Providers>
        </body>
      {/*  */}
    </html>
  );
}

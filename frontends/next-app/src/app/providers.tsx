"use client"
import { ThemeProvider } from "ol-components"

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>
}

export default Providers

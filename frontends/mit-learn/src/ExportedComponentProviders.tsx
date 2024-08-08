import React, { StrictMode } from "react"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Provider as NiceModalProvider } from "@ebay/nice-modal-react"
import { ThemeProvider } from "ol-components"

interface ExportedComponentProps {
  queryClient: QueryClient
}

/**
 * Renders child with Router, QueryClientProvider, and other such context provides.
 */
const ExportedComponentProviders: React.FC<ExportedComponentProps> = ({
  queryClient,
}) => {
  const interiorElements = (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NiceModalProvider></NiceModalProvider>
        <ReactQueryDevtools
          initialIsOpen={false}
          toggleButtonProps={{ style: { opacity: 0.5 } }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  )

  return <StrictMode>{interiorElements}</StrictMode>
}

export default ExportedComponentProviders

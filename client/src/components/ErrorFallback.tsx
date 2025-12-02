import React from "react"
import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { LayoutWithHeader } from "components/Layout"
import { reset } from "functions/reset"

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <LayoutWithHeader className="pb-5">
      <Alert variant="danger">
        <Alert.Heading>Oops, something went wrong 😔</Alert.Heading>
        {error.message && <span>Error: {error.message}</span>}
      </Alert>
      <Button
        size="lg"
        onClick={resetErrorBoundary}
      >
        Click here to try again
      </Button>
    </LayoutWithHeader>
  )
}

interface ErrorBoundaryWrapperProps {
    children: React.ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={reset}
    >
      {children}
    </ErrorBoundary>
  )
}

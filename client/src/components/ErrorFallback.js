import { Alert, Button } from "react-bootstrap"
import { ErrorBoundary } from "react-error-boundary"
import { LayoutWithHeader } from "components/Layout"
import { reset } from "functions/reset"

export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <LayoutWithHeader className="pb-5">
      <Alert variant="danger">
        <Alert.Heading>Oops, something went wrong 😔</Alert.Heading>
        {error.message && <span>Error: {error.message}</span>}
      </Alert>
      <Button size="lg" onClick={resetErrorBoundary}>
        Click here to try again
      </Button>
    </LayoutWithHeader>
  )
}

export function ErrorBoundaryWrapper({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
      {children}
    </ErrorBoundary>
  )
}

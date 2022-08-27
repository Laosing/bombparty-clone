import React from "react"
import { Container } from "react-bootstrap"
import clsx from "clsx"

export const Layout = ({ children, className, ...props }) => {
  return (
    <Container
      className={clsx("my-lg-5 mt-3 mb-5 text-center", className)}
      {...props}
    >
      {children}
    </Container>
  )
}
export const LayoutWithHeader = ({ children, ...props }) => (
  <Layout {...props}>{children}</Layout>
)

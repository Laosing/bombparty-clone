import React from "react"
import Container, { ContainerProps } from "react-bootstrap/Container"
import clsx from "clsx"

interface LayoutProps extends ContainerProps {
    children: React.ReactNode;
}

export const Layout = ({ children, className, ...props }: LayoutProps) => {
  return (
    <Container
      className={clsx("my-lg-5 mt-3 mb-5 text-center", className)}
      {...props}
    >
      {children}
    </Container>
  )
}
export const LayoutWithHeader = ({ children, ...props }: LayoutProps) => (
  <Layout {...props}>{children}</Layout>
)

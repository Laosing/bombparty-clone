import React from "react"

import "./App.scss"
import "animate.css"
import "react-toastify/dist/ReactToastify.css"

import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"

import { useGameStore } from "hooks/useStore"
import { Home } from "components/Home"
import { ValidateRoom } from "components/ValidateRoom"
import { InitializeSocket } from "components/InitializeSocket"
import { ErrorBoundaryWrapper } from "components/ErrorFallback"
import { Turnstile } from "@marsidev/react-turnstile"
import { isDevEnv } from "functions/session"

function App() {
  return (
    <Captcha>
      <ErrorBoundaryWrapper>
        <InitializeSocket>
          <Outlet />
        </InitializeSocket>
      </ErrorBoundaryWrapper>
    </Captcha>
  )
}

function Captcha({ children }) {
  const ref = React.useRef()
  const [status, setStatus] = React.useState("solved")

  if (status === "solved") {
    return <>{children}</>
  }

  if (status === "error") {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="text-center">
          <h1>Error</h1>
          <p>Something went wrong, please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="d-flex justify-content-center align-items-center h-100">
      <Turnstile
        ref={ref}
        onSuccess={() => setStatus("solved")}
        onError={() => setStatus("error")}
        siteKey={
          isDevEnv ? "1x00000000000000000000AA" : "0x4AAAAAABYeXvkUzwifs3U4"
        }
      />
    </div>
  )
}

const Router = () => {
  const theme = useGameStore((store) => store.theme)
  return (
    <BrowserRouter>
      <ToastContainer
        autoClose={false}
        position="top-center"
        theme={theme}
        style={{ width: "100%", maxWidth: "600px" }}
      />
      <Routes>
        <Route
          path="/"
          element={<App />}
        >
          <Route
            index
            element={<Home />}
          />
          <Route
            path=":roomId"
            element={<ValidateRoom />}
          ></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router

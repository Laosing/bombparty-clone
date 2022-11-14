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

function App() {
  return (
    <ErrorBoundaryWrapper>
      <InitializeSocket>
        <Outlet />
      </InitializeSocket>
    </ErrorBoundaryWrapper>
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
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path=":roomId" element={<ValidateRoom />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router

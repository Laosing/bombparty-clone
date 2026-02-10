import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import clsx from "clsx"
import { useGameStore } from "hooks/useStore"
import { useSocket } from "hooks/useSocket"
import { useRoom } from "hooks/useRoom"
import { useIdle } from "hooks/useIdle"
import { MessagesWrapper } from "components/Messages"
import { PrivateTooltip } from "components/PrivateTooltip"
import { Hr } from "components/Hr"
import { Game } from "components/Game"
import { EditName } from "components/EditName"
import { AvatarSettings } from "components/AvatarSettings"
import { AudioSettings } from "components/AudioSettings"
import { GameSettings } from "components/GameSettings"
import { GithubLink } from "components/GithubLink"
import { reset } from "functions/reset"

export function Room() {
  const { socket } = useSocket()
  const { roomId, room } = useRoom() as any
  const theme = useGameStore((state) => state.theme)
  const isPrivate = room.get("private")
  const isAdmin = useGameStore((state) => state.isAdmin)

  const resetClient = () => socket.emit("resetClient")

  useEffect(() => {
    socket.on("resetClient", reset)
    return () => {
      socket.off("resetClient", reset)
    }
  }, [socket])

  useIdle()

  return (
    <div
      className={clsx(
        "flex flex-col lg:flex-row min-h-screen lg:h-screen bg-base-100",
        theme,
      )}
    >
      {isAdmin && (
        <button
          type="button"
          onClick={resetClient}
          className="btn btn-ghost btn-circle btn-sm absolute top-2 right-4 lg:right-auto lg:left-4 z-50 text-xl"
          title="Reset client"
        >
          ☠️
        </button>
      )}

      {/* Chat Column */}
      <aside className="w-full lg:w-72 flex flex-col bg-base-200 border-r border-base-300 shrink-0 lg:h-screen lg:order-first order-last">
        <div className="divider my-1 text-[0.55rem] opacity-50 tracking-widest uppercase">
          Chat
        </div>
        <MessagesWrapper />
      </aside>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col min-h-0 lg:overflow-y-auto">
        <GithubLink />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Game />
        </div>
      </main>

      {/* Sidebar: Settings */}
      <aside className="w-full lg:w-80 flex flex-col bg-base-200 border-l border-base-300 shrink-0 lg:overflow-y-auto overflow-x-hidden">
        <div className="px-4">
          <AvatarSettings />
          <EditName />
        </div>

        <div className="px-4">
          <div className="flex justify-between items-center bg-base-100 p-3 rounded-xl border border-base-300 shadow-sm mb-4">
            <span className="text-sm font-medium">
              Room: <strong className="font-mono text-primary">{roomId}</strong>{" "}
              {isPrivate && <PrivateTooltip />}
            </span>
            <Link to="/" className="btn btn-error btn-xs rounded-lg">
              Leave room
            </Link>
          </div>
        </div>

        <div className="divider my-1 text-[0.55rem] opacity-50 tracking-widest uppercase">
          Audio
        </div>
        <AudioSettings />

        <div className="divider my-1 text-[0.55rem] opacity-50 tracking-widest uppercase">
          Game Settings
        </div>
        <GameSettings />
      </aside>
    </div>
  )
}

import { Server, Socket } from "socket.io";
import { registerGameHandlers } from "./handlers/gameHandler.ts";

export default function game(io: Server) {
  io.on("connection", (socket: Socket) => {
    registerGameHandlers(io, socket);
  });
}

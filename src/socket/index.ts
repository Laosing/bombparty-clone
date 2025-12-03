import { Server, Socket } from "socket.io";
import { registerGameHandlers } from "./handlers/gameHandler.js";
import { RoomManager } from "../managers/RoomManager.js";

export default function game(io: Server) {
  // Initialize RoomManager with IO
  const roomManager = RoomManager.getInstance();
  roomManager.setIo(io);

  io.on("connection", (socket: Socket) => {
    registerGameHandlers(io, socket);
  });
}

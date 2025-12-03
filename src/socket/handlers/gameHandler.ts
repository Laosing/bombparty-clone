import { Server, Socket } from "socket.io";
import { RoomManager } from "../../managers/RoomManager.js";
import { logger } from "../../utils/logger.js";
import SuperJSON from "superjson";

export function registerGameHandlers(io: Server, socket: Socket) {
  const roomManager = RoomManager.getInstance();
  // Ensure IO is set
  roomManager.setIo(io);

  // Connection-specific state (cached for performance/access)
  let _roomId: string = "";

  const getLog = () => ({
      userId: socket.handshake.auth.userId,
      roomId: _roomId
  });

  socket.on("joinRoom", joinRoom);
  socket.on("getRooms", getRooms);
  socket.on("joinGame", joinGame);
  socket.on("joinGroup", joinGroup);
  socket.on("leaveGame", leaveGame);
  socket.on("kickPlayer", kickPlayer); // Mapped kickPlayer to leaveGame with extra arg
  socket.on("setSettings", setSettings);
  socket.on("checkWord", checkWord);
  socket.on("setGlobalInputText", setGlobalInputText);
  socket.on("startGame", startGame);
  socket.on("startGameNoCounter", startGameNoCounter);
  socket.on("stopGame", stopGame);
  socket.on("getRoom", relayRoom);
  socket.on("updateName", updateName);
  socket.on("updateAvatar", updateAvatar);
  socket.on("message", handleUserMessage);
  socket.on("getMessages", relayMessages);
  socket.on("disconnect", disconnect);

  // Legacy or unhandled events
  socket.on("resetClient", resetClient);

  socket.on("connect_error", (err) => {
    logger.error(`connect_error due to ${err.message}`);
  });
  socket.onAny((eventName, ...args) => {
    if (eventName !== "setGlobalInputText") {
      logger.info({ eventName, ...args, ...getLog() });
    }
  });

  function joinRoom({
    roomId,
    isPrivate,
    name,
    avatarSeed,
  }: {
    roomId: string;
    isPrivate: boolean;
    name: string;
    avatarSeed: string;
  }) {
    _roomId = roomId;
    const room = roomManager.getOrCreateRoom(roomId);

    room.setPrivate(Boolean(isPrivate));

    const userId = socket.handshake.auth.userId;
    room.addUser({
        id: userId,
        name,
        avatar: avatarSeed,
        inGame: false,
        group: "",
    });

    socket.join(roomId);
    getRooms(); // Broadcast rooms list to everyone? Or just update? The original called it.
  }

  function getRooms() {
      // Logic to send public rooms list
      const roomsWithPrivate = roomManager.getPublicRooms().map(r => [
          r.id,
          {
              players: r.players,
              isPrivate: false // Filtered in getPublicRooms? Or do we send all?
              // The original filtered out socket IDs, kept rooms.
              // Logic was:
              // const gameRooms = Array.from(io.sockets.adapter.rooms).filter(...)
              // const roomsWithPrivate = gameRooms.map(...)
          }
      ]);

      // Let's replicate original logic using Adapter to be safe about what is a "Room" vs "Socket ID"
      const clients = Array.from(io.sockets.adapter.sids.keys());
      const gameRooms = Array.from(io.sockets.adapter.rooms).filter(
        (entry: any) => {
          const id = entry[0];
          return !clients.includes(id);
        }
      ) as [string, Set<string>][];

      const response = gameRooms.map(([roomId, players]) => {
          const roomInstance = roomManager.getRoom(roomId);
          return [
              roomId,
              {
                  players,
                  isPrivate: roomInstance ? roomInstance.isPrivate : false
              }
          ];
      });

      io.emit("getRooms", SuperJSON.serialize(response));
  }

  function relayRoom() {
      if (!_roomId) return;
      const room = roomManager.getRoom(_roomId);
      if (room) {
          room.broadcastRoomState();
      }
  }

  function joinGame(userId: string) {
      const room = roomManager.getRoom(_roomId);
      if (room) room.joinGame(userId);
  }

  function joinGroup(groupId: string, memberId: string) {
      const room = roomManager.getRoom(_roomId);
      if (room) room.joinGroup(groupId, memberId);
  }

  function leaveGame(userId: string) {
      const room = roomManager.getRoom(_roomId);
      if (room) room.leaveGame(userId);
  }

  function kickPlayer(userId: string, kickerId: string) {
       const room = roomManager.getRoom(_roomId);
       if (room) room.leaveGame(userId, kickerId);
  }

  function setSettings(data: any) {
      const userId = socket.handshake.auth.userId;
      const room = roomManager.getRoom(_roomId);
      if (room) room.updateSettings(data, userId);
  }

  function checkWord(value: string, groupId: string) {
      const room = roomManager.getRoom(_roomId);
      if (room) room.game.checkWord(value, groupId);
      setGlobalInputText(); // clear input
  }

  function setGlobalInputText(text = "") {
      io.sockets.in(_roomId).emit("setGlobalInputText", text);
  }

  function startGame() {
      const userId = socket.handshake.auth.userId;
      const room = roomManager.getRoom(_roomId);
      if (room) room.startCountDown(userId);
  }

  function startGameNoCounter() {
      const userId = socket.handshake.auth.userId;
      const room = roomManager.getRoom(_roomId);
      if (room) room.startGame(userId);
  }

  function stopGame() {
      const userId = socket.handshake.auth.userId;
      const room = roomManager.getRoom(_roomId);
      if (room) room.stopGame(userId);
  }

  function updateName(value: string, userId: string) {
      const room = roomManager.getRoom(_roomId);
      if (room && value) {
          const user = room.users.get(userId);
          if (user) {
              user.name = value;
              // update messages?
              // The original logic updated messages too.
              // We should probably just let the room handle this or update user ref.
              // Since messages hold User object, updating user object in Map *might* reflect if same ref.
              // But Message.user is likely a copy or ref.
              // Let's traverse messages if needed.
              // Original code:
              /*
                const updateMessages = [...messages].map((m) => ({
                    ...m,
                    user: { ...m.user, name: m.user.id === userId ? value : m.user.name },
                }));
               */
               const newMessages = new Set<any>();
               room.messages.forEach(m => {
                   if (m.user.id === userId) {
                       m.user.name = value;
                   }
                   newMessages.add(m);
               });
               room.messages = newMessages;
               room.broadcastRoomState();
          }
      }
  }

  function updateAvatar(userId: string, newSeed: string) {
      const room = roomManager.getRoom(_roomId);
      if (room) {
          const user = room.users.get(userId);
          if (user) {
              user.avatar = newSeed;
              room.broadcastRoomState();
          }
      }
  }

  function handleUserMessage(value: string) {
      const userId = socket.handshake.auth.userId;
      const room = roomManager.getRoom(_roomId);
      if (room) room.handleMessage(userId, value);
  }

  function relayMessages() {
       const room = roomManager.getRoom(_roomId);
       if (room) {
            io.sockets.in(_roomId).emit("messages", SuperJSON.serialize(room.messages));
       }
  }

  function resetClient() {
      io.sockets.in(_roomId).emit("resetClient");
  }

  function disconnect(reason: any) {
      if (!_roomId) return;
      const userId = socket.handshake.auth.userId;
      const room = roomManager.getRoom(_roomId);
      if (room) {
          room.removeUser(userId);
          if (room.isEmpty()) {
              roomManager.removeRoom(_roomId);
          }
      }
  }
}

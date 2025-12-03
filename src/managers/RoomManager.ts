import { Room } from "../models/Room.js";
import { Server } from "socket.io";
import { logger } from "../utils/logger.js";

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map();
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public setIo(io: Server) {
    this.io = io;
  }

  public getIo(): Server {
    if (!this.io) {
      throw new Error("Socket.IO instance not set in RoomManager");
    }
    return this.io;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public createRoom(roomId: string): Room {
    const room = new Room(roomId, this.getIo());
    this.rooms.set(roomId, room);
    return room;
  }

  public getOrCreateRoom(roomId: string): Room {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }
    return room;
  }

  public removeRoom(roomId: string) {
    this.rooms.delete(roomId);
    logger.info(`Room ${roomId} deleted.`);
  }

  public getPublicRooms() {
    // Logic to list public rooms
    // We need to know which rooms have users and are not private
    const roomsList = [];
    for (const [id, room] of this.rooms) {
      if (!room.isEmpty() && !room.isPrivate) {
         // This assumes we track 'isPrivate' on the room
         // and we can get a list of players
         roomsList.push({ id, players: room.getPlayerIds() });
      }
    }
    return roomsList;
  }
}

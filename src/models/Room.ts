import { Server, Socket } from "socket.io";
import { Room as RoomType, User, Message, Settings, RoomProps, Group } from "../types.js";
import { Game } from "./Game.js";
import { nanoid } from "nanoid";
import SuperJSON from "superjson";
import { logger } from "../utils/logger.js";

export class Room {
  public id: string;
  public users: Map<string, User> = new Map();
  public messages: Set<Message> = new Set();
  public settings: Map<keyof Settings, number | boolean> = new Map();
  public private: boolean = false;
  public game: Game;

  private io: Server;
  private _countDownInterval?: NodeJS.Timeout | string | number | Symbol;

  constructor(id: string, io: Server) {
    this.id = id;
    this.io = io;
    this.initializeSettings();
    this.game = new Game(this.settings);
    this.setupGameListeners();
  }

  private initializeSettings() {
    this.settings.set("timer", 10);
    this.settings.set("lives", 2);
    this.settings.set("hardMode", 5);
    this.settings.set("hardModeEnabled", true);
    this.settings.set("letterBlendCounter", 2);
  }

  private setupGameListeners() {
      // Game events -> Room broadcasts
      this.game.on("gameUpdated", () => this.broadcastRoomState());
      this.game.on("wordValid", (data) => this.io.to(this.id).emit("wordValidation", true, data));
      this.game.on("wordInvalid", (data) => this.io.to(this.id).emit("wordValidation", false, data));
      this.game.on("gainedHeart", (groupId) => this.io.to(this.id).emit("gainedHeart", groupId));
      this.game.on("bonusLetter", (letter) => this.io.to(this.id).emit("bonusLetter", letter));
      this.game.on("boom", (data) => {
          this.io.to(this.id).emit("boom", data.group);
          this.io.to(this.id).emit("boomWord", data.wordDetails);
      });
      this.game.on("winner", (winner) => this.io.to(this.id).emit("winner", true));
  }

  public addUser(user: User) {
      this.users.set(user.id, user);
      this.broadcastRoomState();
  }

  public removeUser(userId: string) {
      const user = this.users.get(userId);
      if (user) {
          this.users.delete(userId);
          this.game.removeMemberFromGroup(userId);
          this.game.stop(); // Stop game if checking users fails?
          // Current logic in gameHandler checkNoUsers() stops game if no active users.
          this.checkNoUsers();

          this.io.to(this.id).emit("userLeft");
          this.broadcastRoomState();
      }
  }

  public joinGame(userId: string) {
      const user = this.users.get(userId);
      if (user) {
          user.inGame = true;
          user.score = 0;
          this.users.set(userId, user);

          // Create a new group for the user initially
          const groupId = nanoid();
          this.game.addGroup(groupId, userId);
          user.group = groupId; // Update user group

          this.io.to(this.id).emit("userJoined", userId);
          this.broadcastRoomState();
          this.sendAdminMessage(userId, "joined the game");
      }
  }

  public joinGroup(groupId: string, userId: string) {
      const user = this.users.get(userId);
      if (!user) return;

      const oldGroupId = user.group;
      if (oldGroupId) {
          this.game.removeMemberFromGroup(userId);
      }

      const targetGroup = this.game.groups.get(groupId);
      if (targetGroup) {
          this.game.joinGroup(groupId, userId);
          user.group = groupId;
      } else {
          // Fallback to creating new group if target invalid
          const newGroupId = nanoid();
          this.game.addGroup(newGroupId, userId);
          user.group = newGroupId;
      }
      this.users.set(userId, user);
      this.broadcastRoomState();
  }

  public leaveGame(userId: string, kickerId?: string) {
      const user = this.users.get(userId);
      if (user) {
          user.inGame = false;
          user.group = "";
          this.users.set(userId, user);
          this.game.removeMemberFromGroup(userId); // remove=true logic

          this.checkNoUsers();
          this.broadcastRoomState();

          if (kickerId) {
              const kicker = this.users.get(kickerId);
              this.sendAdminMessage("", `${kicker?.name} kicked ${user.name} from the game`);
          } else {
              this.sendAdminMessage(userId, "left the game");
          }
      }
  }

  public checkNoUsers() {
      const activeUsers = Array.from(this.users.values()).filter(u => u.inGame);
      if (activeUsers.length <= 0) {
          this.game.stop();
          return true;
      }
      return false;
  }

  public updateSettings(data: Partial<Settings>, userId?: string) {
      const newSettings = new Map(this.settings);
      if (data.timer) newSettings.set("timer", Number(data.timer));
      if (data.lives) newSettings.set("lives", data.lives);
      if (data.hardMode) newSettings.set("hardMode", data.hardMode);
      if (data.hardModeEnabled !== undefined) newSettings.set("hardModeEnabled", data.hardModeEnabled);
      if (data.letterBlendCounter) newSettings.set("letterBlendCounter", data.letterBlendCounter);

      this.settings = newSettings;
      this.game.setSettings(newSettings);

      if (userId) {
          this.io.to(this.id).emit("setSettings", SuperJSON.serialize(this.settings));
          this.broadcastRoomState();
          this.sendAdminMessage(userId, "changed the settings");
      }
  }

  public startCountDown(userId: string) {
      if (this.game.running) return;

      this.game.isCountDown = true;
      let countDown = 5;

      // Clear existing if any
      if (this._countDownInterval) clearInterval(this._countDownInterval as any);

      const intervalFn = () => {
          if (this.checkNoUsers()) {
               this.game.isCountDown = false;
               this.io.to(this.id).emit("startCountDown", undefined);
               clearInterval(this._countDownInterval as any);
               this.broadcastRoomState();
               return;
          }
          countDown -= 1;
          this.io.to(this.id).emit("startCountDown", countDown);
          if (countDown <= 0) {
              clearInterval(this._countDownInterval as any);
              this.startGame(userId);
              this.io.to(this.id).emit("startCountDown", undefined); // Clear frontend counter
          }
      };

      this._countDownInterval = setInterval(intervalFn, 1000);
      this.io.to(this.id).emit("startCountDown", countDown);
      this.broadcastRoomState();
      this.sendAdminMessage(userId, "started the game");
  }

  public startGame(userId: string) {
      if (this.checkNoUsers()) {
          this.game.stop();
          return;
      }
      // Stop countdown if running
      if (this._countDownInterval) clearInterval(this._countDownInterval as any);

      this.game.start();
      if (userId && !this.game.isCountDown) {
          // If called directly via "startGameNoCounter" logic
          this.sendAdminMessage(userId, "immediately started the game");
      }
  }

  public stopGame(userId?: string) {
      this.game.stop();
      if (userId) {
          this.sendAdminMessage(userId, "stopped the game");
      }
  }

  public handleMessage(userId: string, value: string) {
      const user = this.users.get(userId);
      if (user) {
          this.createMessage(user, value);
      }
  }

  private createMessage(user: User, value: string) {
      const message: Message = {
          id: nanoid(),
          user,
          value,
          time: Date.now(),
      };
      this.messages.add(message);
      this.io.to(this.id).emit("messages", SuperJSON.serialize(this.messages));
  }

  public sendAdminMessage(userId: string, text: string) {
      // Admin user mock
      const adminUser: User = { id: "admin", name: "", avatar: "", inGame: false, group: "" };
      let message = text;
      if (userId) {
        const user = this.users.get(userId);
        if (user) {
            message = `${user.name} ${text}`;
        }
      }
      this.createMessage(adminUser, message);
  }

  public broadcastRoomState() {
      // Serialize handles maps and sets, which JSON.stringify doesn't
      this.io.to(this.id).emit("getRoom", SuperJSON.serialize(this.toDTO()));
  }

  public toDTO(): Map<keyof RoomType, any> {
      // We need to return the exact Map<keyof Room, any> structure expected by frontend
      const dto = new Map<keyof RoomType, any>();
      dto.set("messages", this.messages);
      dto.set("users", this.users);
      dto.set("groups", this.game.groups);
      dto.set("words", this.game.words);
      dto.set("letterBlend", this.game.letterBlend);
      dto.set("letterBlendWord", this.game.letterBlendWord);
      dto.set("letterBlendCounter", this.game.letterBlendCounter);
      dto.set("timerConstructor", this.game.timer); // Frontend uses this to get time?? Or just internal?
      // Actually frontend logic might use timerConstructor properties.
      // The original code passed `new Timer()` instance.

      dto.set("timer", this.game.timerValue);
      dto.set("round", this.game.round);
      dto.set("hardMode", this.game.hardMode);
      dto.set("currentGroup", this.game.currentGroup);
      dto.set("startingPlayer", this.game.startingPlayer);
      dto.set("running", this.game.running);
      dto.set("winner", this.game.winner);
      dto.set("settings", this.settings);
      dto.set("private", this.private);
      dto.set("isCountDown", this.game.isCountDown);

      // Internal usage in frontend?
      dto.set("_countDownInterval", this._countDownInterval);

      return dto;
  }

  public isEmpty() {
      return this.users.size === 0;
  }

  public getPlayerIds() {
      return new Set(this.users.keys());
  }

  public get isPrivate() {
      return this.private;
  }

  public setPrivate(isPrivate: boolean) {
      this.private = isPrivate;
  }
}

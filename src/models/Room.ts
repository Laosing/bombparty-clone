import { nanoid } from "nanoid";
import { Timer } from "../Timer.js";
import { User, Room, Group, Message, Settings, RoomProps } from "../types.js";

// We'll move the Room state management logic here eventually.
// For now, let's keep the types and maybe some helper functions.

export const defaultSettings: Settings = {
  timer: 10,
  lives: 2,
  hardMode: 5,
  hardModeEnabled: true,
  letterBlendCounter: 2,
};

export function createRoom(roomId: string, isPrivate: boolean): RoomProps & { room: Map<keyof Room, any> } {
  const room = new Map<keyof Room, any>();

  const setProp = (prop: keyof Room, initialValue: any) =>
    room.get(prop) || room.set(prop, initialValue).get(prop);

  const props: RoomProps = {
    messages: setProp("messages", [] as Message[]),
    users: setProp("users", new Map<string, User>()),
    groups: setProp("groups", new Map<string, Group>()),
    words: setProp("words", new Set<string>()),
    letterBlend: setProp("letterBlend", ""),
    letterBlendWord: setProp("letterBlendWord", ""),
    letterBlendCounter: setProp("letterBlendCounter", 0),
    timerConstructor: setProp("timerConstructor", new Timer()),
    timer: setProp("timer", 0),
    round: setProp("round", 0),
    hardMode: setProp("hardMode", false),
    currentGroup: setProp("currentGroup", ""),
    startingPlayer: setProp("startingPlayer", ""),
    running: setProp("running", false),
    winner: setProp("winner", null),
    settings: setProp("settings", new Map<string, any>()),
    private: setProp("private", isPrivate),
    isCountDown: setProp("isCountDown", false),
  };

  return { room, ...props };
}

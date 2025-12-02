import { Server, Socket } from "socket.io";
import { nanoid } from "nanoid";
import serialize from "serialize-javascript";
import pino from "pino";
import { User, Room, Group, Message, Settings, RoomProps } from "../../types.ts";
import { Timer } from "../../Timer.ts";
import { dictionaryService } from "../../services/DictionaryService.ts";
import { getRandomLettersFn } from "../../shared/utils.ts";

// Global state for rooms (migrated from game.ts)
export const rooms = new Map<string, Map<keyof Room, any>>();

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const LETTER_BONUS = 10;

const admin: { name: string } = {
  name: "",
};

// Helper functions (migrated)
const getRandomElement = <T>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function registerGameHandlers(io: Server, socket: Socket) {
  let _firstRound = true;
  let _roomId: string;

  const log = pino({
    mixin() {
      return {
        userId: socket.handshake.auth.userId,
        roomId: _roomId,
      };
    },
  });

  socket.on("resetClient", resetClient);
  socket.on("leaveRoom", disconnect);
  socket.on("joinRoom", joinRoom);
  socket.on("getRooms", getRooms);
  socket.on("joinGame", joinGame);
  socket.on("joinGroup", joinGroup);
  socket.on("leaveGame", leaveGame);
  socket.on("kickPlayer", leaveGame);
  socket.on("setSettings", setSettings);
  socket.on("checkWord", checkWord);
  socket.on("setGlobalInputText", setGlobalInputText);
  socket.on("startGame", startCountDown);
  socket.on("startGameNoCounter", startGameClearCounter);
  socket.on("stopGame", stopGame);
  socket.on("getRoom", relayRoom);
  socket.on("updateName", updateName);
  socket.on("updateAvatar", updateAvatar);
  socket.on("message", handleUserMessage);
  socket.on("getMessages", relayMessages);
  socket.on("disconnect", disconnect);
  socket.on("connect_error", (err) => {
    log.error(`connect_error due to ${err.message}`);
  });
  socket.onAny((eventName, ...args) => {
    if (eventName !== "setGlobalInputText") {
      log.info({ eventName, ...args });
    }
  });

  // --- Room Logic ---

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

    initializeRoom();
    getRoom(isPrivate);
    initializeUser(name, avatarSeed);
    setSettings();

    socket.join(_roomId);
    getRooms();
    relayRoom();
  }

  function initializeRoom() {
    const room = rooms.get(_roomId);
    if (!room) {
      rooms.set(_roomId, new Map());
    }
  }

  function getRooms() {
    const clients = Array.from(io.sockets.adapter.sids.keys());
    const gameRooms = Array.from(io.sockets.adapter.rooms).filter(
      (entry: any) => {
        const id = entry[0];
        return !clients.includes(id);
      }
    ) as [string, Set<string>][];
    const roomsWithPrivate = gameRooms.map(([room, players]) => [
      room,
      {
        players,
        isPrivate: Boolean(rooms.get(room)?.get("private")),
      },
    ]);
    io.emit("getRooms", serialize(roomsWithPrivate));
  }

  function getRoom(
    isPrivate?: boolean
  ): RoomProps & { room: Map<keyof Room, any> } {
    const room =
      rooms.get(_roomId) || rooms.set("null_room", new Map()).get("null_room")!;
    const setProp = (prop: keyof Room, initialValue: any) =>
      room.get(prop) || room.set(prop, initialValue).get(prop);

    const props: RoomProps = {
      messages: setProp("messages", new Set<Message>()),
      users: setProp("users", new Map<string, User>()),
      groups: setProp("groups", new Map<string, Group>()),
      words: setProp("words", new Set<string>()),
      letterBlend: setProp("letterBlend", ""),
      letterBlendWord: setProp("letterBlendWord", ""),
      letterBlendCounter: setProp("letterBlendCounter", 0),
      timerConstructor: setProp("timerConstructor", new Timer()), // Factory call
      timer: setProp("timer", 0),
      round: setProp("round", 0),
      hardMode: setProp("hardMode", false),
      currentGroup: setProp("currentGroup", ""),
      startingPlayer: setProp("startingPlayer", ""),
      running: setProp("running", false),
      winner: setProp("winner", null),
      settings: setProp("settings", new Map<string, any>()),
      private: setProp("private", Boolean(isPrivate)),
      isCountDown: setProp("isCountDown", false),
    } as RoomProps;

    return { room, ...props };
  }

  function relayRoom() {
    const { room } = getRoom();
    // Serialize handles maps and sets, which JSON.stringify doesn't
    io.sockets.in(_roomId).emit("getRoom", serialize(room));
  }

  // --- Game Logic ---

  function joinGame(userId: string) {
    const { users } = getRoom();
    const user = users.get(userId);
    if (user) {
      users.set(userId, { ...user, inGame: true, score: 0 });
      initializeGroup(userId);
      io.sockets.in(_roomId).emit("userJoined", userId);
      relayRoom();
      sendAdminMessage(userId, "joined the game");
    }
  }

  function initializeGroup(userId: string) {
    const { groups, users } = getRoom();
    const id = nanoid();

    groups.set(id, {
      id,
      letters: new Set(),
      score: 0,
      bonusLetters: new Set(),
      members: new Set([userId]),
      activeTyper: 0,
      lives: 0, // Initial lives will be set by resetGroup or usage
      text: "",
    });

    const user = users.get(userId);
    if (user) {
      users.set(userId, { ...user, group: id });
    }
  }

  function joinGroup(groupId: string, memberId: string) {
    const { groups, users } = getRoom();
    const user = users.get(memberId);
    const group = groups.get(groupId);

    leaveGroup(memberId);

    if (groupId && group && user) {
      groups.set(groupId, {
        ...group,
        members: new Set([memberId, ...group.members]),
      });
      users.set(memberId, { ...user, group: groupId });
    } else {
      initializeGroup(memberId);
    }

    relayRoom();
  }

  function leaveGroup(memberId: string, remove = false) {
    const { groups, users, room } = getRoom();
    const user = users.get(memberId);
    if (!user) return;
    const group = groups.get(user.group);

    if (group) {
      group.members.delete(memberId);
      users.set(memberId, { ...user, group: "" });
      cleanGroups();
    }
    room.set("winner", null);
  }

  function cleanGroups() {
    const { groups } = getRoom();
    groups.forEach((group) => {
      if (group.members.size === 0) {
        groups.delete(group.id);
      }
    });
  }

  function leaveGame(userId: string, kickerId?: string) {
    const { users } = getRoom();
    const user = users.get(userId);
    if (user) {
      users.set(userId, { ...user, inGame: false });
    }

    leaveGroup(userId, true);

    checkNoUsers();

    relayRoom();

    if (kickerId && user) {
      const kickerUser = users.get(kickerId);
      if (kickerUser) {
        createMessage(
          admin as User,
          `${kickerUser.name} kicked ${user.name} from the game`
        );
      }
    } else {
      sendAdminMessage(userId, "left the game");
    }
  }

  function setLetterBlend() {
    const { room } = getRoom();
    const randomWord = dictionaryService.getRandomWord();
    if (randomWord) {
      const [letters, word] = getRandomLettersFn(randomWord)();
      log.info({ word, letters });
      room.set("letterBlend", letters);
      room.set("letterBlendWord", word);
    }
  }

  function setGlobalInputText(text = "") {
    io.sockets.in(_roomId).emit("setGlobalInputText", text);
  }

  function resetClient() {
    io.sockets.in(_roomId).emit("resetClient");
  }

  function updateName(value: string, userId: string) {
    if (!value) return;
    const { users, messages, room } = getRoom();
    const player = users.get(userId);
    if (player) {
      users.set(userId, { ...player, name: value });
      if (messages.size) {
        const updateMessages = [...messages].map((m) => ({
          ...m,
          user: { ...m.user, name: m.user.id === userId ? value : m.user.name },
        }));
        room.set("messages", new Set(updateMessages));
        relayMessages();
      }
      relayRoom();
    }
  }

  function updateAvatar(userId: string, newSeed: string) {
    const { users } = getRoom();
    const player = users.get(userId);
    if (player) {
      users.set(userId, { ...player, avatar: newSeed });
      relayRoom();
    }
  }

  function setHeartLetters(groupId: string, value: string) {
    const { groups } = getRoom();
    const group = groups.get(groupId);
    if (!group) return;

    const letters = new Set([...group.letters, ...value.split("")]);
    const bonusletter = getBonusLetters(value, letters);
    const newLetters = new Set([...letters, ...bonusletter]);

    if (newLetters.size >= 26) {
      groups.set(groupId, {
        ...group,
        lives: Number(group.lives) >= 10 ? 10 : Number(group.lives) + 1,
        letters: new Set(),
        bonusLetters: new Set(),
      });
      io.sockets.in(_roomId).emit("gainedHeart", groupId);
    } else {
      groups.set(groupId, {
        ...group,
        letters: newLetters,
        bonusLetters: new Set([...group.bonusLetters, ...bonusletter]),
      });
    }
  }

  function getBonusLetters(value: string, letters: Set<string>) {
    if (value.length > LETTER_BONUS) {
      const lettersArray = [...letters];
      const remainingLetters = ALPHABET.split("").filter(
        (l) => !lettersArray.includes(l)
      );
      const randomLetter = getRandomElement(remainingLetters);
      io.sockets.in(_roomId).emit("bonusLetter", randomLetter);
      return randomLetter || "";
    }
    return "";
  }

  function checkWord(value: string, groupId: string) {
    const { letterBlend, words, currentGroup, timerConstructor } = getRoom();
    const isBlend = value.includes(letterBlend.toLowerCase());
    const isDictionary = dictionaryService.checkWord(value);
    const isUnique = !words.has(value);
    const isLongEnough = value.length >= 3;
    const isCurrentGroup = currentGroup === groupId;

    if (isBlend && isDictionary && isUnique && isLongEnough && isCurrentGroup) {
      log.info(`valid word: ${value}`);
      io.sockets
        .in(_roomId)
        .emit("wordValidation", true, { value, letterBlend, currentGroup });
      words.add(value);
      setGroupText(groupId, value);
      setHeartLetters(groupId, value);
      resetletterBlendCounter();
      setLetterBlend();
      timerConstructor.reset();
      switchGroup();
    } else {
      log.info(`invalid word: ${value}`);
      io.sockets.in(_roomId).emit("wordValidation", false, {
        isBlend,
        isDictionary,
        isUnique,
        isLongEnough,
        currentGroup,
      });
      setGroupText(groupId, "");
    }
    setGlobalInputText();
    relayRoom();
  }

  function switchGroup() {
    const { room, groups, currentGroup } = getRoom();
    const nextGroup = !currentGroup
      ? getRandomPlayer(groups)
      : getNextPlayer(groups);
    room.set("currentGroup", nextGroup);
    setGroupText(nextGroup, "");
  }

  function loseLife() {
    const { groups, currentGroup } = getRoom();
    const group = groups.get(currentGroup);
    if (group) {
      const lives = group.lives > 0 ? group.lives - 1 : 0;
      groups.set(currentGroup, { ...group, lives });
    }
  }

  function setGroupText(groupId: string, text: string) {
    const { groups, letterBlend } = getRoom();
    const group = groups.get(groupId);
    if (group) {
      groups.set(groupId, { ...group, text, letterBlend });
    }
  }

  function resetTimer() {
    const { room, timerConstructor, hardMode, settings } = getRoom();
    const settingsTimer = settings.get("timer") as number;
    const hardModeEnabled = settings.get("hardModeEnabled") as boolean;
    if (hardModeEnabled && hardMode && settingsTimer > 1) {
      const num = getRandomInt(0, Math.ceil(settingsTimer / 2));
      const seconds = settingsTimer - num;
      timerConstructor.setTimer(seconds);
      room.set("timer", seconds);
    } else {
      room.set("timer", settingsTimer);
    }
  }

  function updateTimer() {
    const { room, timerConstructor, groups, currentGroup } = getRoom();

    checkNoUsers();
    const leftGame = !Array.from(groups).find((entry: any) => {
      const id = entry[0];
      return id === currentGroup;
    });
    if (leftGame) {
      switchGroup();
      timerConstructor.reset();
    }

    const seconds = timerConstructor.getTime();
    room.set("timer", seconds);
    if (seconds > 0) {
      relayRoom();
    }
  }

  function onTimerFinish() {
    const {
      timerConstructor,
      currentGroup,
      letterBlend,
      letterBlendWord,
      letterBlendCounter,
    } = getRoom();
    const wordDetails =
      letterBlendCounter <= 1 ? [letterBlend, letterBlendWord] : ["", ""];
    io.sockets.in(_roomId).emit("boom", currentGroup);
    io.sockets.in(_roomId).emit("boomWord", wordDetails);
    loseLife();
    const hasWinner = checkGameState();
    if (!hasWinner) {
      switchGroup();
      switchletterBlend();
      timerConstructor.reset();
    }
    relayRoom();
  }

  function resetletterBlendCounter() {
    const { room, settings } = getRoom();
    const settingsLetterBlendCounter = settings.get("letterBlendCounter");
    room.set("letterBlendCounter", settingsLetterBlendCounter);
  }

  function switchletterBlend() {
    const { room, letterBlendCounter } = getRoom();
    const counter = letterBlendCounter - 1;
    room.set("letterBlendCounter", counter);
    if (counter <= 0) {
      resetletterBlendCounter();
      setLetterBlend();
    }
  }

  function startGameClearCounter(userId: string) {
    const { room } = getRoom();
    const interval = room.get("_countDownInterval");
    if (interval) {
      clearInterval(interval as any);
    }
    startGame();
    io.sockets.in(_roomId).emit("startCountDown", undefined);

    sendAdminMessage(userId, "immediately started the game");
  }

  function startCountDown(userId: string) {
    const { room, running } = getRoom();

    if (running) return;

    const interval = setInterval(countDownFn, 1000);

    room.set("isCountDown", true).set("_countDownInterval", interval);

    let countDown = 5;
    function countDownFn() {
      if (checkNoUsers()) {
        room.set("isCountDown", false);
        io.sockets.in(_roomId).emit("startCountDown", undefined);
        clearInterval(room.get("_countDownInterval"));
        relayRoom();
        return;
      }
      countDown -= 1;
      io.sockets.in(_roomId).emit("startCountDown", countDown);
      if (countDown <= 0) {
        startGameClearCounter(userId);
      }
    }

    io.sockets.in(_roomId).emit("startCountDown", countDown);
    relayRoom();

    sendAdminMessage(userId, "started the game");
  }

  function startGame() {
    const { room, settings, timerConstructor } = getRoom();

    // No players, don't start the game
    if (checkNoUsers()) return stopGame();

    const startTimer = settings.get("timer") as number;
    room
      .set("timer", startTimer)
      .set("running", true)
      .set("words", new Set())
      .set("round", 1)
      .set("hardMode", false)
      .set("startingPlayer", "")
      .set("isCountDown", false);

    _firstRound = true;
    setLetterBlend();
    resetletterBlendCounter();
    resetGroup();
    switchGroup();

    timerConstructor.on("reset", resetTimer);
    timerConstructor.on("secondsUpdated", updateTimer);
    timerConstructor.on("targetAchieved", onTimerFinish);

    timerConstructor.start(startTimer);
  }

  function checkGameState() {
    const { groups } = getRoom();
    const _groups = Array.from(groups);
    const remainingGroups = _groups.filter(([, val]) => val.lives > 0);
    const lastGroup = remainingGroups.length <= 1;
    const singlePlayer = _groups.length === 1 ? _groups[0][1].lives <= 0 : false;
    const hasWinner = _groups.length === 1 ? singlePlayer : lastGroup
    if (hasWinner) {
      io.sockets.in(_roomId).emit("winner", true);
      const [groupId, winner] = remainingGroups[0] || _groups[0];
      if (winner) {
        groups.set(groupId, { ...winner, score: winner.score + 1 });
        stopGame(winner, undefined);
      }
    }
    return hasWinner;
  }

  function stopGame(group?: Group, userId?: string) {
    const { room, timerConstructor } = getRoom();
    timerConstructor.stop();
    timerConstructor.removeAllEventListeners();
    room
      .set("winner", group || null)
      .set("running", false)
      .set("currentGroup", "")
      .set("isCountDown", false);
    relayRoom();

    if (userId) {
      sendAdminMessage(userId, "stopped the game");
    }
  }

  function resetGroup() {
    const { room, groups, settings } = getRoom();
    const lives = settings.get("lives") as number;
    const updatedGroup = Array.from(groups, (entry: any) => {
      const key = entry[0];
      const value = entry[1];
      return [
        key,
        {
          ...value,
          letters: new Set(),
          lives,
          text: "",
          bonusLetters: new Set(),
          activeTyper: 0,
        },
      ];
    }) as [string, Group][];
    room.set("groups", new Map(updatedGroup));
  }

  function checkIncrementRound(groups: [string, Group][]) {
    const { currentGroup, startingPlayer, room } = getRoom();

    if (!groups.find(([id, val]) => id === startingPlayer && val?.lives > 0)) {
      room.set("startingPlayer", currentGroup);
    }
    if (currentGroup === startingPlayer) {
      if (groups.length === 1) return incrementRound();
      if (_firstRound) {
        _firstRound = false;
      } else {
        incrementRound();
      }
    }
  }

  function incrementRound() {
    const { room, round, settings } = getRoom();
    const hardMode = settings.get("hardMode") as number;
    const hardModeEnabled = settings.get("hardModeEnabled");
    const newRound = round + 1;
    if (hardModeEnabled && newRound > hardMode) {
      room.set("hardMode", true);
    }
    room.set("round", newRound);
  }

  function incrementActiveTyper() {
    const { groups, currentGroup } = getRoom();
    const group = groups.get(currentGroup);
    if (group) {
      const activeTyper = group.activeTyper + 1;
      groups.set(currentGroup, { ...group, activeTyper });
    }
  }

  function getNextPlayer(collection: Map<string, Group>) {
    const { currentGroup } = getRoom();
    const groups = [...collection].filter(([, val]) => val.members.size);

    incrementActiveTyper();
    checkIncrementRound(groups);

    let currentIndex = groups.findIndex(([key]) => key === currentGroup);
    if (currentIndex === groups.length - 1) currentIndex = 0;

    let nextGroupId;
    for (let i = currentIndex; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;

      const [id, val] = group;
      if (val.lives <= 0 || id === currentGroup) continue;
      nextGroupId = id;
      break;
    }

    if (!nextGroupId) {
      const remainingGroups = groups.filter(([, val]) => val.lives > 0);
      nextGroupId = remainingGroups[0]?.[0];
    }

    return nextGroupId;
  }

  function getRandomPlayer(collection: Map<string, Group>) {
    const { room } = getRoom();
    const keys = Array.from(collection)
      .filter(([, val]) => val.members.size)
      .map(([id]) => id);
    const randomPlayer = getRandomElement(keys);
    room.set("startingPlayer", randomPlayer);
    return randomPlayer;
  }

  // --- User Logic ---

  function initializeUser(name: string, avatarSeed: string) {
    const { userId } = socket.handshake.auth;
    const { users } = getRoom();
    users.set(userId, {
      id: userId,
      name,
      avatar: avatarSeed,
      inGame: false,
      group: "",
    });
  }

  // --- Settings Logic ---

  function setSettings(data?: Partial<Settings>, userId?: string) {
    const { settings } = getRoom();

    const timer = data?.timer || settings.get("timer") || 10;
    const lives = data?.lives || settings.get("lives") || 2;
    const hardMode = data?.hardMode || settings.get("hardMode") || 5;
    const hardModeEnabled =
      data?.hardModeEnabled ?? settings.get("hardModeEnabled") ?? true;
    const letterBlendCounter =
      data?.letterBlendCounter || settings.get("letterBlendCounter") || 2;
    settings
      .set("timer", Number(timer))
      .set("lives", lives)
      .set("hardMode", hardMode)
      .set("hardModeEnabled", hardModeEnabled)
      .set("letterBlendCounter", letterBlendCounter);
    if (data && userId) {
      io.sockets.in(_roomId).emit("setSettings", serialize(settings));
      relayRoom();

      sendAdminMessage(userId, "changed the settings");
    }
  }

  // --- Chat/Message Logic ---

  function sendAdminMessage(userId: string, message: string) {
    const { users } = getRoom();
    const user = users.get(userId);
    if (user) {
      createMessage(admin as User, `${user.name} ${message}`);
    }
  }

  function handleUserMessage(value: string) {
    const { userId } = socket.handshake.auth;
    const { users } = getRoom();
    const user = users.get(userId);
    if (user) {
      createMessage(user, value);
    }
  }

  function createMessage(user: User, value: string) {
    const { messages } = getRoom();
    const message: Message = {
      id: nanoid(),
      user,
      value,
      time: Date.now(),
    };
    messages.add(message);
    relayMessages();
  }

  function relayMessages() {
    const { messages } = getRoom();
    io.sockets.in(_roomId).emit("messages", serialize(messages));
  }

  // --- Connection/Disconnect Logic ---

  function removeUserFromRoom(userId: string) {
    const { users } = getRoom();
    users.delete(userId);
    if (_roomId) {
      io.sockets.in(_roomId).emit("userLeft");
      socket.leave(_roomId);
    }
  }

  function disconnect(reason: any) {
    if (!_roomId) return;
    if (reason) log.info({ reason });

    const { userId } = socket.handshake.auth;
    const { users } = getRoom();
    leaveGame(userId);
    removeUserFromRoom(userId);
    // Stop game if no users left
    checkNoUsers();
    relayRoom();
    if (users.size === 0 && _roomId) {
      log.info(`Deleting room: ${_roomId}`);
      rooms.delete(_roomId);
    }
  }

  function checkNoUsers() {
    const { users } = getRoom();
    const activeUsers = [...users].filter(([, val]) => val.inGame);
    if (activeUsers.length <= 0) {
      stopGame();
      return true;
    }
    return false;
  }
}

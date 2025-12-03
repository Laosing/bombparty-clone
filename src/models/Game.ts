import { EventEmitter } from "events";
import { Group, Settings } from "../types.js";
import { Timer } from "../Timer.js";
import { dictionaryService } from "../services/DictionaryService.js";
import { getRandomLettersFn } from "../shared/utils.js";
import { logger } from "../utils/logger.js";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const LETTER_BONUS = 10;

export class Game extends EventEmitter {
  public groups: Map<string, Group> = new Map();
  public words: Set<string> = new Set();
  public letterBlend: string = "";
  public letterBlendWord: string = "";
  public letterBlendCounter: number = 0;
  public timer: Timer;
  public timerValue: number = 0;
  public round: number = 0;
  public hardMode: boolean | number = false;
  public currentGroup: string = "";
  public startingPlayer: string = "";
  public running: boolean = false;
  public winner: Group | null = null;
  public isCountDown: boolean = false;

  // Settings are passed from Room or managed here?
  // Probably passed in constructor or updated.
  private settings: Map<keyof Settings, number | boolean>;

  private _firstRound: boolean = true;

  constructor(settings: Map<keyof Settings, number | boolean>) {
    super();
    this.settings = settings;
    this.timer = new Timer();

    // Timer events
    this.timer.on("reset", () => this.handleTimerReset());
    this.timer.on("secondsUpdated", () => this.handleTimerUpdate());
    this.timer.on("targetAchieved", () => this.handleTimerFinish());
  }

  public getSettings() {
      return this.settings;
  }

  public setSettings(settings: Map<keyof Settings, number | boolean>) {
      this.settings = settings;
  }

  public start() {
    if (this.groups.size === 0) return; // Should not happen if checked before

    const startTimer = this.settings.get("timer") as number;
    this.timerValue = startTimer;
    this.running = true;
    this.words.clear();
    this.round = 1;
    this.hardMode = false;
    this.startingPlayer = "";
    this.isCountDown = false;
    this.winner = null;

    this._firstRound = true;
    this.setLetterBlend();
    this.resetLetterBlendCounter();
    this.resetGroups();
    this.switchGroup();

    this.timer.start(startTimer);
    this.emit("gameUpdated");
  }

  public stop(winnerGroup?: Group) {
    this.timer.stop();
    this.timer.removeAllEventListeners();
    // Re-attach listeners because we might restart?
    // Actually, create new Timer or just re-attach.
    // The current implementation re-attaches in 'startGame'.
    // Better to just stop.

    this.running = false;
    this.winner = winnerGroup || null;
    this.currentGroup = "";
    this.isCountDown = false;
    this.emit("gameUpdated");
  }

  public addGroup(id: string, userId: string) {
    this.groups.set(id, {
      id,
      letters: new Set(),
      score: 0,
      bonusLetters: new Set(),
      members: new Set([userId]),
      activeTyper: 0,
      lives: 0,
      text: "",
    });
  }

  public joinGroup(groupId: string, userId: string) {
      const group = this.groups.get(groupId);
      if (group) {
          group.members.add(userId);
          // Update wrapper object reference if needed or Map does it by ref
          this.groups.set(groupId, group);
      }
  }

  public removeMemberFromGroup(userId: string): string | undefined {
      let leftGroupId: string | undefined;
      for (const [groupId, group] of this.groups) {
          if (group.members.has(userId)) {
              group.members.delete(userId);
              leftGroupId = groupId;
              if (group.members.size === 0) {
                  this.groups.delete(groupId);
              } else {
                  this.groups.set(groupId, group);
              }
              break;
          }
      }
      return leftGroupId;
  }

  public checkWord(value: string, groupId: string): boolean {
    const isBlend = value.includes(this.letterBlend.toLowerCase());
    const isDictionary = dictionaryService.checkWord(value);
    const isUnique = !this.words.has(value);
    const isLongEnough = value.length >= 3;
    const isCurrentGroup = this.currentGroup === groupId;

    const isValid = isBlend && isDictionary && isUnique && isLongEnough && isCurrentGroup;

    if (isValid) {
      logger.info(`valid word: ${value}`);
      this.words.add(value);
      this.setGroupText(groupId, value);
      this.setHeartLetters(groupId, value);
      this.resetLetterBlendCounter();
      this.setLetterBlend();
      this.timer.reset();
      this.switchGroup();
      this.emit("wordValid", { value, letterBlend: this.letterBlend, currentGroup: this.currentGroup });
    } else {
      logger.info(`invalid word: ${value}`);
      this.setGroupText(groupId, "");
      this.emit("wordInvalid", { isBlend, isDictionary, isUnique, isLongEnough, currentGroup: this.currentGroup });
    }

    this.emit("gameUpdated");
    return isValid;
  }

  private setLetterBlend() {
    const randomWord = dictionaryService.getRandomWord();
    if (randomWord) {
      const [letters, word] = getRandomLettersFn(randomWord)();
      this.letterBlend = letters;
      this.letterBlendWord = word;
    }
  }

  private resetLetterBlendCounter() {
    const settingsLetterBlendCounter = this.settings.get("letterBlendCounter") as number;
    this.letterBlendCounter = settingsLetterBlendCounter;
  }

  private switchLetterBlend() {
    this.letterBlendCounter -= 1;
    if (this.letterBlendCounter <= 0) {
      this.resetLetterBlendCounter();
      this.setLetterBlend();
    }
  }

  private setGroupText(groupId: string, text: string) {
    const group = this.groups.get(groupId);
    if (group) {
      group.text = text;
      // In old code, it also set letterBlend on the group? "groups.set(groupId, { ...group, text, letterBlend });"
      // Wait, "letterBlend" property on Group interface is optional.
      group.letterBlend = this.letterBlend;
      this.groups.set(groupId, group);
    }
  }

  private setHeartLetters(groupId: string, value: string) {
    const group = this.groups.get(groupId);
    if (!group) return;

    const currentLetters = new Set([...group.letters, ...value.split("")]);
    const bonusLetter = this.getBonusLetters(value, currentLetters);
    const newLetters = new Set([...currentLetters, ...bonusLetter]);

    if (newLetters.size >= 26) {
        // Gained a life
        group.lives = (Number(group.lives) >= 10) ? 10 : Number(group.lives) + 1;
        group.letters = new Set();
        group.bonusLetters = new Set();
        this.emit("gainedHeart", groupId);
    } else {
        group.letters = newLetters;
        if (bonusLetter) {
            group.bonusLetters.add(bonusLetter);
        }
    }
    this.groups.set(groupId, group);
  }

  private getBonusLetters(value: string, letters: Set<string>): string {
    if (value.length > LETTER_BONUS) {
      const lettersArray = [...letters];
      const remainingLetters = ALPHABET.split("").filter(
        (l) => !lettersArray.includes(l)
      );
      // Helper?
      const randomLetter = remainingLetters[Math.floor(Math.random() * remainingLetters.length)];
      if (randomLetter) {
          this.emit("bonusLetter", randomLetter);
          return randomLetter;
      }
    }
    return "";
  }

  private switchGroup() {
    // Logic to pick next group
    const groupsArray = Array.from(this.groups.values()).filter(g => g.members.size > 0);
    if (groupsArray.length === 0) return;

    let nextGroupId: string | undefined;

    if (!this.currentGroup) {
        // First pick
        const randomGroup = groupsArray[Math.floor(Math.random() * groupsArray.length)];
        nextGroupId = randomGroup.id;
        this.startingPlayer = nextGroupId;
    } else {
        // Next player logic
        // Need to replicate complicated logic from gameHandler: getNextPlayer
        nextGroupId = this.getNextPlayerId(groupsArray);
    }

    this.currentGroup = nextGroupId || "";
    this.setGroupText(this.currentGroup, "");
  }

  private getNextPlayerId(groups: Group[]): string {
     // increment active typer for current group
     const currentGroupObj = this.groups.get(this.currentGroup);
     if (currentGroupObj) {
         currentGroupObj.activeTyper += 1;
         this.groups.set(this.currentGroup, currentGroupObj);
     }

     this.checkIncrementRound(groups);

     let currentIndex = groups.findIndex(g => g.id === this.currentGroup);
     // If not found (maybe eliminated), start from 0
     if (currentIndex === -1) currentIndex = 0;
     else if (currentIndex === groups.length - 1) currentIndex = 0; // Wrap around to start searching? No, wait.
     // Actually the logic was:
     // if (currentIndex === groups.length - 1) currentIndex = 0;
     // This just resets the search index?

     // The old logic iterates from currentIndex to find the next ALIVE player.
     // But if we are at end of array, we should wrap to 0.
     // Let's implement a standard circular search.

     const count = groups.length;
     let nextId: string | undefined;

     // Start checking from the next index
     for (let i = 1; i <= count; i++) {
         const checkIndex = (currentIndex + i) % count;
         const group = groups[checkIndex];
         if (group.lives > 0 && group.id !== this.currentGroup) {
             nextId = group.id;
             break;
         }
     }

     // If no one else found (e.g. only 1 player left or all others dead), fallback logic
     if (!nextId) {
         const remaining = groups.filter(g => g.lives > 0);
         if (remaining.length > 0) nextId = remaining[0].id;
     }

     return nextId || "";
  }

  private checkIncrementRound(groups: Group[]) {
      // If we are back to starting player, or starting player is dead
      const startingPlayerAlive = groups.find(g => g.id === this.startingPlayer && g.lives > 0);

      if (!startingPlayerAlive) {
          this.startingPlayer = this.currentGroup;
      }

      if (this.currentGroup === this.startingPlayer) {
          if (groups.length === 1) {
              this.incrementRound();
          } else if (this._firstRound) {
              this._firstRound = false;
          } else {
              this.incrementRound();
          }
      }
  }

  private incrementRound() {
      this.round += 1;
      const hardModeLimit = this.settings.get("hardMode") as number;
      const hardModeEnabled = this.settings.get("hardModeEnabled") as boolean;
      if (hardModeEnabled && this.round > hardModeLimit) {
          this.hardMode = true;
      }
  }

  private handleTimerReset() {
      const settingsTimer = this.settings.get("timer") as number;
      const hardModeEnabled = this.settings.get("hardModeEnabled") as boolean;

      if (hardModeEnabled && this.hardMode && settingsTimer > 1) {
          const num = Math.floor(Math.random() * (Math.ceil(settingsTimer / 2) + 1));
          const seconds = settingsTimer - num;
          this.timer.setTimer(seconds);
          this.timerValue = seconds;
      } else {
          this.timerValue = settingsTimer;
      }
  }

  private handleTimerUpdate() {
      // Check if current group still exists
      const groupExists = this.groups.has(this.currentGroup);
      if (!groupExists) {
          this.switchGroup();
          this.timer.reset();
      }

      this.timerValue = this.timer.getTime();
      this.emit("gameUpdated");
  }

  private handleTimerFinish() {
      const boomWordDetails = this.letterBlendCounter <= 1
        ? [this.letterBlend, this.letterBlendWord]
        : ["", ""];

      this.emit("boom", { group: this.currentGroup, wordDetails: boomWordDetails });

      this.loseLife();
      const hasWinner = this.checkGameState();
      if (!hasWinner) {
          this.switchGroup();
          this.switchLetterBlend();
          this.timer.reset();
      }
      this.emit("gameUpdated");
  }

  private loseLife() {
      const group = this.groups.get(this.currentGroup);
      if (group) {
          group.lives = group.lives > 0 ? group.lives - 1 : 0;
          this.groups.set(this.currentGroup, group);
      }
  }

  private checkGameState(): boolean {
      const groupsArray = Array.from(this.groups.values());
      const remainingGroups = groupsArray.filter(g => g.lives > 0);

      const lastGroup = remainingGroups.length <= 1;
      const singlePlayer = groupsArray.length === 1 ? groupsArray[0].lives <= 0 : false;
      const hasWinner = groupsArray.length === 1 ? singlePlayer : lastGroup;

      if (hasWinner) {
          const winner = remainingGroups[0] || groupsArray[0];
          if (winner) {
              winner.score += 1;
              this.groups.set(winner.id, winner);
              this.stop(winner);
              this.emit("winner", winner); // Emitting winner object instead of true? Frontend expects boolean for event "winner"
          }
      }
      return hasWinner;
  }

  private resetGroups() {
      const lives = this.settings.get("lives") as number;
      for (const [id, group] of this.groups) {
          this.groups.set(id, {
              ...group,
              letters: new Set(),
              lives,
              text: "",
              bonusLetters: new Set(),
              activeTyper: 0
          });
      }
  }
}

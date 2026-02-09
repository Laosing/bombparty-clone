export interface User {
  id: string;
  name: string;
  avatar: string;
  inGame: boolean;
  group: string;
  score?: number;
}

export interface Group {
  id: string;
  letters: Set<string>;
  score: number;
  bonusLetters: Set<string>;
  members: Set<string>;
  activeTyper: number;
  lives: number;
  text: string;
  letterBlend?: string;
}

export interface Message {
  id: string;
  user: User;
  value: string;
  time: number;
}

export interface Settings {
  timer: number;
  lives: number;
  hardMode: number;
  hardModeEnabled: boolean;
  letterBlendCounter: number;
}

export interface Room {
  messages: Message[];
  users: Map<string, User>;
  groups: Map<string, Group>;
  words: Set<string>;
  letterBlend: string;
  letterBlendWord: string;
  letterBlendCounter: number;
  timerConstructor: any; // Timer instance, circular dependency issue if we import Timer here, but we can manage
  timer: number;
  round: number;
  hardMode: boolean | number;
  currentGroup: string;
  startingPlayer: string;
  running: boolean;
  winner: Group | null;
  settings: Map<keyof Settings, number | boolean>;
  private: boolean;
  isCountDown: boolean;
  _countDownInterval?: NodeJS.Timeout | string | number | Symbol; // Depending on environment
}

// Helper type for Room properties
export interface RoomProps {
  messages: Message[];
  users: Map<string, User>;
  groups: Map<string, Group>;
  words: Set<string>;
  letterBlend: string;
  letterBlendWord: string;
  letterBlendCounter: number;
  timerConstructor: any;
  timer: number;
  round: number;
  hardMode: boolean | number;
  currentGroup: string;
  startingPlayer: string;
  running: boolean;
  winner: Group | null;
  settings: Map<keyof Settings, number | boolean>;
  private: boolean;
  isCountDown: boolean;
}

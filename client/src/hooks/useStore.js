import { nanoid } from "nanoid"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getRandomName } from "functions/session"

export const SOUND_SETTINGS = "sound-settings"
export const GAME_SETTINGS = "game-settings"

export const useSoundStore = create(
  persist(
    (set, get) => ({
      music: true,
      toggleMusic: () => set({ music: !get().music }),
      musicVersion: 0,
      toggleMusicVersion: () =>
        set({ musicVersion: get().musicVersion === 0 ? 1 : 0 }),
      soundEffects: true,
      toggleSoundEffects: () => set({ soundEffects: !get().soundEffects }),
      volume: 0.25,
      setVolume: (val) => set({ volume: val }),
    }),
    { name: SOUND_SETTINGS }
  )
)

export const useGameStore = create(
  persist(
    (set, get) => ({
      name: getRandomName(),
      setName: (name) => set({ name }),
      userId: nanoid(),
      avatarSeed: nanoid(),
      setAvatarSeed: (seed) => set({ avatarSeed: seed }),
      theme: "light",
      switchTheme: () =>
        set({ theme: get().theme === "light" ? "dark" : "light" }),
      isAdmin: false,
      setIsAdmin: () => set({ isAdmin: !get().isAdmin }),
    }),
    { name: GAME_SETTINGS }
  )
)

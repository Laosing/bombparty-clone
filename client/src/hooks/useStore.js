import { nanoid } from "nanoid"
import create from "zustand"
import { persist } from "zustand/middleware"
import { getRandomName } from "functions/session"

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
      setVolume: (val) => set({ volume: val })
    }),
    { name: "sound-settings" }
  )
)

export const useGameStore = create(
  persist(
    (set, get) => ({
      name: getRandomName(),
      setName: (name) => set({ name }),
      userId: nanoid(),
      theme: "light",
      switchTheme: () =>
        set({ theme: get().theme === "light" ? "dark" : "light" }),
      isAdmin: false,
      setIsAdmin: () => set({ isAdmin: !get().isAdmin })
    }),
    { name: "game-settings" }
  )
)

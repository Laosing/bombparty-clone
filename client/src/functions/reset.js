import { GAME_SETTINGS, SOUND_SETTINGS } from "hooks/useStore"

export const reset = () => {
  localStorage.removeItem(SOUND_SETTINGS)
  localStorage.removeItem(GAME_SETTINGS)
  window.location.href = "/"
}

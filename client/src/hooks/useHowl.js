import React, { useEffect } from "react"
import { Howl } from "howler"
import { useSoundStore } from "hooks/useStore"

export const useHowl = (src, type = "effect", props) => {
  const [soundMusicSettings, soundEffectSettings] = useSoundStore((state) => [
    state.music,
    state.soundEffects
  ])

  const json = JSON.stringify({ src, ...props })
  const sound = React.useMemo(() => {
    return new Howl(JSON.parse(json))
  }, [json])

  useEffect(() => {
    return () => sound.unload()
  }, [sound])

  if (type === "music") setTimeout(() => sound.mute(!soundMusicSettings), 0)
  if (type === "effect") setTimeout(() => sound.mute(!soundEffectSettings), 0)

  return [sound]
}

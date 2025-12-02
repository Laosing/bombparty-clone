import React, { useEffect } from "react"
import { Howl, HowlOptions } from "howler"
import { useSoundStore } from "hooks/useStore"

export const useHowl = (src: string | string[], type: "effect" | "music" = "effect", props?: Omit<HowlOptions, 'src'>): [Howl] => {
  const soundMusicSettings = useSoundStore((state) => state.music)
  const soundEffectSettings = useSoundStore((state) => state.soundEffects)

  const json = JSON.stringify({ src, ...props })
  const sound = React.useMemo(() => {
    return new Howl(JSON.parse(json))
  }, [json])

  useEffect(() => {
    return () => {
      sound.unload()
    }
  }, [sound])

  if (type === "music") setTimeout(() => sound.mute(!soundMusicSettings), 0)
  if (type === "effect") setTimeout(() => sound.mute(!soundEffectSettings), 0)

  return [sound]
}

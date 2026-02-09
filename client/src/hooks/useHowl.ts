import React, { useEffect } from "react"
import { Howl, HowlOptions } from "howler"
import { useSoundStore } from "hooks/useStore"

export const useHowl = (src: string | string[], type: "effect" | "music" = "effect", props?: Omit<HowlOptions, 'src'>): [Howl] => {
  const soundMusicSettings = useSoundStore((state) => state.music)
  const soundEffectSettings = useSoundStore((state) => state.soundEffects)

  const shouldMute = type === "music" ? !soundMusicSettings : !soundEffectSettings

  const json = JSON.stringify({ src, ...props })
  const sound = React.useMemo(() => {
    const howl = new Howl(JSON.parse(json))
    howl.mute(shouldMute)
    return howl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json])

  useEffect(() => {
    return () => {
      sound.unload()
    }
  }, [sound])

  useEffect(() => {
    sound.mute(shouldMute)
  }, [sound, shouldMute])

  return [sound]
}

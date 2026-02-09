import React, { useEffect, useRef } from "react"
import { Howl, HowlOptions } from "howler"
import { useSoundStore } from "hooks/useStore"

export const useHowl = (src: string | string[], type: "effect" | "music" = "effect", props?: Omit<HowlOptions, 'src'>): [Howl] => {
  const soundMusicSettings = useSoundStore((state) => state.music)
  const soundEffectSettings = useSoundStore((state) => state.soundEffects)

  const shouldMute = type === "music" ? !soundMusicSettings : !soundEffectSettings
  const shouldMuteRef = useRef(shouldMute)
  shouldMuteRef.current = shouldMute

  // Strip autoplay from props — we handle it manually based on mute state
  const { autoplay, ...restProps } = props || {}
  const json = JSON.stringify({ src, ...restProps })
  const sound = React.useMemo(() => {
    return new Howl(JSON.parse(json))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json])

  // Handle autoplay and mute state when sound is created or mute changes
  useEffect(() => {
    sound.mute(shouldMute)
    if (autoplay) {
      if (shouldMute) {
        sound.pause()
      } else if (!sound.playing()) {
        sound.play()
      }
    }
  }, [sound, shouldMute, autoplay])

  useEffect(() => {
    // If autoplay was requested and not muted, start playing on creation
    if (autoplay && !shouldMuteRef.current) {
      sound.play()
    }
    return () => {
      sound.unload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound])

  return [sound]
}

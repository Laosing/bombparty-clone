import React, { useEffect } from "react"
import { Howler } from "howler"
import { useGameStore, useSoundStore } from "hooks/useStore"
import { MusicLabel } from "components/MusicLabel"

export function AudioSettings() {
  const music = useSoundStore((store) => store.music)
  const toggleMusic = useSoundStore((store) => store.toggleMusic)
  const soundEffects = useSoundStore((store) => store.soundEffects)
  const toggleSoundEffects = useSoundStore((store) => store.toggleSoundEffects)
  const volume = useSoundStore((store) => store.volume)
  const setVolume = useSoundStore((store) => store.setVolume)

  const theme = useGameStore((store) => store.theme)
  const switchTheme = useGameStore((store) => store.switchTheme)
  const toggleMusicVersion = useSoundStore((store) => store.toggleMusicVersion)

  useEffect(() => {
    Howler.volume(volume)
  }, [volume])

  return (
    <form className="px-4 flex flex-col gap-1">
      <div className="grid grid-cols-1">
        <div className="flex flex-col gap-2">
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4 flex-wrap">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={!!music}
                onChange={toggleMusic}
              />
              <span className="label-text flex items-center gap-2">
                Music
                <MusicLabel toggleMusicVersion={toggleMusicVersion} />
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={!!soundEffects}
                onChange={toggleSoundEffects}
              />
              <span className="label-text">Sound effects</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={theme === "dark"}
                onChange={switchTheme}
              />
              <span className="label-text">Dark Mode</span>
            </label>
          </div>
        </div>
      </div>

      <div className="form-control">
        <label className="label" htmlFor="settingsVolume">
          <span className="label-text">Volume</span>
          <span className="label-text-alt">{Math.round(volume * 100)}%</span>
        </label>
        <input
          type="range"
          id="settingsVolume"
          min="0"
          max="1"
          step="0.025"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="range range-primary range-xs"
        />
      </div>
    </form>
  )
}

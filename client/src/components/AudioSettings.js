import React, { useEffect } from "react"
import Form from "react-bootstrap/Form"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
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
    <Form className="p-3">
      <Row>
        <Col>
          <Form.Check
            type="switch"
            id="settingsMusic"
          >
            <Form.Check.Input
              checked={!!music}
              onChange={toggleMusic}
            />
            <Form.Check.Label>Music</Form.Check.Label>
            <MusicLabel toggleMusicVersion={toggleMusicVersion} />
          </Form.Check>
          <Form.Check
            type="switch"
            id="settingsSoundEffects"
            checked={!!soundEffects}
            onChange={toggleSoundEffects}
            label="Sound effects"
          />
        </Col>
        <Col>
          <Form.Check
            type="switch"
            id="settingsTheme"
            checked={theme === "dark"}
            onChange={switchTheme}
            label="Dark Mode"
          />
        </Col>
      </Row>
      <Form.Label
        htmlFor="settingsVolume"
        className="mt-2 mb-0"
      >
        Volume
      </Form.Label>
      <Form.Range
        id="settingsVolume"
        defaultValue={volume}
        min="0"
        max="1"
        step=".025"
        onChange={(e) => setVolume(e.target.value)}
      />
    </Form>
  )
}

export function Timer() {
  let _timer = 0
  let _defaultTimer
  let _interval

  let _events = new Map()

  function start(time) {
    stop()
    if (time) {
      setTimer(time)
    }
    if (_timer === _defaultTimer && _events.get("secondsUpdated")) {
      _events.get("secondsUpdated")()
    }

    _interval = setTimeout(() => {
      _timer -= 1
      if (_events.get("secondsUpdated")) {
        _events.get("secondsUpdated")()
      }
      if (_timer <= 0) {
        stop()
        if (_events.get("targetAchieved")) {
          _events.get("targetAchieved")()
        }
      } else {
        start()
      }
    }, 1000)
  }

  function stop() {
    clearInterval(_interval)
  }

  function reset() {
    if (_events.get("reset")) {
      _events.get("reset")()
    }
    _timer = _defaultTimer
    stop()
    start()
  }

  function setTimer(time) {
    _timer = time
    _defaultTimer = time
  }

  function on(event, fn) {
    _events.set(event, fn)
  }

  function removeAllEventListeners() {
    _events.clear()
  }

  function getTime() {
    return _timer
  }

  return {
    setTimer,
    reset,
    start,
    on,
    removeAllEventListeners,
    stop,
    getTime
  }
}

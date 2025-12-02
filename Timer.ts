export interface TimerInstance {
  setTimer: (time: number) => void;
  reset: () => void;
  start: (time?: number) => void;
  on: (event: string, fn: () => void) => void;
  removeAllEventListeners: () => void;
  stop: () => void;
  getTime: () => number;
}

export function Timer(): TimerInstance {
  let _timer = 0;
  let _defaultTimer = 0;
  let _interval: NodeJS.Timeout | undefined;

  const _events = new Map<string, () => void>();

  function start(time?: number) {
    stop();
    if (time) {
      setTimer(time);
    }
    if (_timer === _defaultTimer && _events.get("secondsUpdated")) {
      _events.get("secondsUpdated")!();
    }

    _interval = setTimeout(() => {
      _timer -= 1;
      if (_events.get("secondsUpdated")) {
        _events.get("secondsUpdated")!();
      }
      if (_timer <= 0) {
        stop();
        if (_events.get("targetAchieved")) {
          _events.get("targetAchieved")!();
        }
      } else {
        start();
      }
    }, 1000);
  }

  function stop() {
    clearTimeout(_interval);
  }

  function reset() {
    if (_events.get("reset")) {
      _events.get("reset")!();
    }
    _timer = _defaultTimer;
    stop();
    start();
  }

  function setTimer(time: number) {
    _timer = time;
    _defaultTimer = time;
  }

  function on(event: string, fn: () => void) {
    _events.set(event, fn);
  }

  function removeAllEventListeners() {
    _events.clear();
  }

  function getTime() {
    return _timer;
  }

  return {
    setTimer,
    reset,
    start,
    on,
    removeAllEventListeners,
    stop,
    getTime
  };
}

/**
 * Timer class that manages a countdown timer with event support.
 * Emits events for timer updates and completion.
 */
export class Timer {
  private _timer: number = 0
  private _defaultTimer: number = 0
  private _interval: NodeJS.Timeout | undefined
  private _events: Map<string, () => void> = new Map()

  /**
   * Set the timer duration
   * @param time - The time in seconds
   */
  setTimer(time: number): void {
    this._timer = time
    this._defaultTimer = time
  }

  /**
   * Stop the timer and clear the interval
   */
  stop(): void {
    if (this._interval) {
      clearTimeout(this._interval)
    }
  }

  /**
   * Reset the timer to its default value and restart it
   */
  reset(): void {
    const resetHandler = this._events.get("reset")
    if (resetHandler) {
      resetHandler()
    }
    this._timer = this._defaultTimer
    this.stop()
    this.start()
  }

  /**
   * Start the countdown timer
   * @param time - Optional time to set before starting
   */
  start(time?: number): void {
    this.stop()
    if (time) {
      this.setTimer(time)
    }
    if (this._timer === this._defaultTimer) {
      const secondsUpdatedHandler = this._events.get("secondsUpdated")
      if (secondsUpdatedHandler) {
        secondsUpdatedHandler()
      }
    }

    this._interval = setTimeout(() => {
      this._timer -= 1
      const secondsUpdatedHandler = this._events.get("secondsUpdated")
      if (secondsUpdatedHandler) {
        secondsUpdatedHandler()
      }
      if (this._timer <= 0) {
        this.stop()
        const targetAchievedHandler = this._events.get("targetAchieved")
        if (targetAchievedHandler) {
          targetAchievedHandler()
        }
      } else {
        this.start()
      }
    }, 1000)
  }

  /**
   * Register an event listener
   * @param event - The event name (e.g., 'secondsUpdated', 'targetAchieved', 'reset')
   * @param fn - The callback function
   */
  on(event: string, fn: () => void): void {
    this._events.set(event, fn)
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this._events.clear()
  }

  /**
   * Get the current timer value
   * @returns The current time in seconds
   */
  getTime(): number {
    return this._timer
  }

  /**
   * Custom JSON serialization - excludes non-serializable properties
   * Only includes state data that can be safely serialized
   */
  toJSON() {
    return {
      _timer: this._timer,
      _defaultTimer: this._defaultTimer,
    }
  }
}

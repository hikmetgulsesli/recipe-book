import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react'
import './Timer.css'

interface TimerProps {
  className?: string
}

type TimerState = 'idle' | 'running' | 'paused' | 'completed'

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Preset durations in seconds
const PRESETS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
]

export function TimerComponent({ className = '' }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  
  // Use refs for interval to ensure background tab compatibility
  const intervalRef = useRef<number | null>(null)
  const targetTimeRef = useRef<number>(0)
  const workerRef = useRef<Worker | null>(null)

  // Initialize audio context on user interaction
  const initAudio = useCallback(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      setAudioContext(ctx)
    }
  }, [audioContext])

  // Play alert sound using Web Audio API
  const playAlert = useCallback(() => {
    if (!soundEnabled || !audioContext) return
    
    try {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Create a pleasant alert sound
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
      oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3) // C6
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.8)
    } catch {
      // Fallback: audio not available
    }
  }, [audioContext, soundEnabled])

  // Setup timer worker for background tab support
  useEffect(() => {
    // Check if Worker is available (not available in jsdom/test environment)
    if (typeof Worker === 'undefined') {
      // Fallback to setInterval for test environments
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerState('completed')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current)
        }
      }
    }
    
    // Create inline worker for background timer
    const workerCode = `
      let intervalId = null;
      
      self.onmessage = function(e) {
        if (e.data.type === 'start') {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => {
            self.postMessage({ type: 'tick' });
          }, 1000);
        } else if (e.data.type === 'stop') {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };
    `
    
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    workerRef.current = new Worker(URL.createObjectURL(blob))
    
    workerRef.current.onmessage = () => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer complete
          setTimerState('completed')
          if (workerRef.current) {
            workerRef.current.postMessage({ type: 'stop' })
          }
          return 0
        }
        return prev - 1
      })
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'stop' })
        workerRef.current.terminate()
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Handle timer completion
  useEffect(() => {
    if (timerState === 'completed') {
      playAlert()
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [timerState, playAlert])

  // Start timer
  const handleStart = useCallback(() => {
    initAudio()
    
    if (timeRemaining === 0) {
      // Set from custom input
      const mins = parseInt(minutes, 10) || 0
      const secs = parseInt(seconds, 10) || 0
      const totalSeconds = mins * 60 + secs
      
      if (totalSeconds > 0) {
        setTotalTime(totalSeconds)
        setTimeRemaining(totalSeconds)
        setTimerState('running')
        targetTimeRef.current = Date.now() + totalSeconds * 1000
        
        if (typeof Worker !== 'undefined' && workerRef.current) {
          workerRef.current.postMessage({ type: 'start' })
        }
      }
    } else {
      // Resume from paused
      setTimerState('running')
      targetTimeRef.current = Date.now() + timeRemaining * 1000
      
      if (typeof Worker !== 'undefined' && workerRef.current) {
        workerRef.current.postMessage({ type: 'start' })
      }
    }
  }, [initAudio, minutes, seconds, timeRemaining])

  // Pause timer
  const handlePause = useCallback(() => {
    setTimerState('paused')
    if (typeof Worker !== 'undefined' && workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' })
    }
  }, [])

  // Reset timer
  const handleReset = useCallback(() => {
    setTimerState('idle')
    setTimeRemaining(0)
    setTotalTime(0)
    setMinutes('')
    setSeconds('')
    if (typeof Worker !== 'undefined' && workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' })
    }
  }, [])

  // Set preset time
  const handlePreset = useCallback((presetSeconds: number) => {
    initAudio()
    setTotalTime(presetSeconds)
    setTimeRemaining(presetSeconds)
    setMinutes(Math.floor(presetSeconds / 60).toString())
    setSeconds((presetSeconds % 60).toString())
    setTimerState('running')
    targetTimeRef.current = Date.now() + presetSeconds * 1000
    
    if (typeof Worker !== 'undefined' && workerRef.current) {
      workerRef.current.postMessage({ type: 'start' })
    }
  }, [initAudio])

  // Handle input changes
  const handleMinutesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) <= 999)) {
      setMinutes(value)
      if (timerState === 'idle') {
        const secs = parseInt(seconds, 10) || 0
        const mins = parseInt(value, 10) || 0
        const total = mins * 60 + secs
        setTotalTime(total)
        setTimeRemaining(total)
      }
    }
  }, [seconds, timerState])

  const handleSecondsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) <= 59)) {
      setSeconds(value)
      if (timerState === 'idle') {
        const mins = parseInt(minutes, 10) || 0
        const secs = parseInt(value, 10) || 0
        const total = mins * 60 + secs
        setTotalTime(total)
        setTimeRemaining(total)
      }
    }
  }, [minutes, timerState])

  // Calculate progress percentage
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0
  const circumference = 2 * Math.PI * 120 // radius = 120
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <section 
      className={`timer-component ${className} ${timerState === 'completed' ? 'completed' : ''}`}
      aria-labelledby="timer-heading"
    >
      {/* Header */}
      <div className="timer-header">
        <h2 id="timer-heading" className="timer-title">
          <Timer className="timer-icon" aria-hidden="true" />
          Cooking Timer
        </h2>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="sound-toggle"
          aria-label={soundEnabled ? 'Mute timer sound' : 'Enable timer sound'}
          type="button"
        >
          {soundEnabled ? (
            <Volume2 className="sound-icon" aria-hidden="true" />
          ) : (
            <VolumeX className="sound-icon" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Timer Display with Circular Progress */}
      <div className="timer-display-container">
        <div className="timer-circle" role="timer" aria-live="polite" aria-atomic="true">
          <svg className="timer-progress-ring" viewBox="0 0 260 260" aria-hidden="true">
            {/* Background circle */}
            <circle
              className="timer-progress-bg"
              cx="130"
              cy="130"
              r="120"
            />
            {/* Progress circle */}
            <circle
              className="timer-progress-fill"
              cx="130"
              cy="130"
              r="120"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="timer-display">
            <span className={`timer-time ${timerState === 'completed' ? 'timer-complete' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
            {timerState !== 'idle' && (
              <span className="timer-status" aria-live="polite">
                {timerState === 'running' && 'Running'}
                {timerState === 'paused' && 'Paused'}
                {timerState === 'completed' && 'Time\'s up!'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="timer-presets" role="group" aria-label="Timer presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.seconds}
            onClick={() => handlePreset(preset.seconds)}
            className="preset-button"
            aria-label={`Set timer to ${preset.label}`}
            type="button"
            disabled={timerState === 'running'}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Time Input */}
      <div className="timer-custom-input">
        <div className="time-input-group">
          <div className="time-field">
            <label htmlFor="timer-minutes" className="time-label">Minutes</label>
            <input
              id="timer-minutes"
              type="number"
              min="0"
              max="999"
              value={minutes}
              onChange={handleMinutesChange}
              placeholder="00"
              className="time-input"
              disabled={timerState === 'running'}
              aria-label="Minutes"
            />
          </div>
          <span className="time-separator" aria-hidden="true">:</span>
          <div className="time-field">
            <label htmlFor="timer-seconds" className="time-label">Seconds</label>
            <input
              id="timer-seconds"
              type="number"
              min="0"
              max="59"
              value={seconds}
              onChange={handleSecondsChange}
              placeholder="00"
              className="time-input"
              disabled={timerState === 'running'}
              aria-label="Seconds"
            />
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="timer-controls" role="group" aria-label="Timer controls">
        {timerState === 'running' ? (
          <button
            onClick={handlePause}
            className="timer-button pause-button"
            aria-label="Pause timer"
            type="button"
          >
            <Pause className="timer-button-icon" aria-hidden="true" />
            Pause
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="timer-button start-button"
            aria-label="Start timer"
            type="button"
            disabled={timerState !== 'completed' && timeRemaining === 0}
          >
            <Play className="timer-button-icon" aria-hidden="true" />
            {timeRemaining > 0 && timerState === 'paused' ? 'Resume' : 'Start'}
          </button>
        )}
        
        <button
          onClick={handleReset}
          className="timer-button reset-button"
          aria-label="Reset timer"
          type="button"
          disabled={timerState === 'idle'}
        >
          <RotateCcw className="timer-button-icon" aria-hidden="true" />
          Reset
        </button>
      </div>
    </section>
  )
}

export type { TimerProps }
export { TimerComponent as Timer }

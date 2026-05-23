import { useEffect, useState } from 'react'
import {
  AlarmClock,
  Bell,
  Clock,
  Eye,
  EyeOff,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings,
  Square,
  X,
} from 'lucide-react'

type TabId = 'tracker' | 'week' | 'manual' | 'settings'

type Task = {
  id: string
  name: string
  time: string
  visible: boolean
  active?: boolean
  dotColor: string
}

type AppUsage = {
  name: string
  duration: string
  minutes: number
  color: string
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'tracker', label: 'Tracker' },
  { id: 'week', label: 'Week' },
  { id: 'manual', label: 'Manual' },
  { id: 'settings', label: 'Settings' },
]

const WEEK_DAYS = [
  { date: '5/18/2026', time: '00h 00m' },
  { date: '5/19/2026', time: '00h 12m' },
  { date: '5/20/2026', time: '00h 08m' },
  { date: '5/21/2026', time: '00h 15m' },
  { date: '5/22/2026', time: '00h 13m' },
  { date: '5/23/2026', time: '00h 00m' },
  { date: '5/24/2026', time: '00h 00m' },
]

const PROJECTS = ['timeMaster app', 'Other', 'Client — Acme', 'Internal', 'Learning']
const TASKS = ['General', 'Design review', 'Documentation', 'Bug fixes']

const APPS_WEBSITES: AppUsage[] = [
  { name: 'Figma', duration: '2h 43m', minutes: 163, color: '#F472B6' },
  { name: 'Code', duration: '1h 24m', minutes: 84, color: '#A78BFA' },
  { name: 'Notion', duration: '55m', minutes: 55, color: '#FB7185' },
  { name: 'Zoom', duration: '41m', minutes: 41, color: '#34D399' },
  { name: 'Discord', duration: '38m', minutes: 38, color: '#2DD4BF' },
  { name: 'x.com', duration: '12m', minutes: 12, color: '#F9A8D4' },
]

/** Hourly activity 1am → 10pm (mock heights 0–1) */
const ACTIVITY_BARS = [0.05, 0.08, 0.12, 0.35, 0.92, 0.88, 0.75, 0.4]
const ACTIVITY_LABELS = ['1am', '4am', '7am', '10am', '1pm', '4pm', '7pm', '10pm']

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatClock(d: Date) {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatTimerShort(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

function formatTimerLong(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200',
        on ? 'bg-[#ff6b2c]' : 'bg-[#3A3A3E]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          on ? 'translate-x-[22px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

function Stepper({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const bump = (dir: 1 | -1) => {
    const [h, m] = value.split(':').map(Number)
    let mins = h * 60 + m + dir * 15
    if (mins < 0) mins = 24 * 60 - 15
    if (mins >= 24 * 60) mins = 0
    onChange(`${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-wide text-[#71717a] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-xl border border-[#27272a] bg-[#0c0c0e] p-1">
        <button
          type="button"
          onClick={() => bump(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] transition hover:bg-[#27272a] hover:text-white"
        >
          −
        </button>
        <span className="min-w-[52px] flex-1 text-center font-mono text-[15px] tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => bump(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] transition hover:bg-[#27272a] hover:text-white"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function MonitaskPopover() {
  const [tab, setTab] = useState<TabId>('tracker')
  const [clock, setClock] = useState(() => formatClock(new Date()))
  const [timerSeconds, setTimerSeconds] = useState(45 * 60 + 20)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [project, setProject] = useState(PROJECTS[0])
  const [note, setNote] = useState('Creating menubar component')
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Website wireframe',
      time: '0h 13m',
      visible: true,
      active: true,
      dotColor: '#ff6b2c',
    },
    {
      id: '2',
      name: 'Email follow-ups',
      time: '0h',
      visible: true,
      dotColor: '#A78BFA',
    },
    {
      id: '3',
      name: 'Research',
      time: '0h',
      visible: false,
      dotColor: '#F59E0B',
    },
  ])

  const [manualDate, setManualDate] = useState('2026-05-22')
  const [manualFrom, setManualFrom] = useState('09:00')
  const [manualTo, setManualTo] = useState('10:00')
  const [manualProject, setManualProject] = useState(PROJECTS[0])
  const [manualTask, setManualTask] = useState(TASKS[0])

  const [settings, setSettings] = useState({
    runOnStart: true,
    notifySnapshots: true,
    keepIdle: false,
    lastScreenshot: true,
    playSound: false,
    language: 'English',
    downtime: 5,
  })

  const maxAppMinutes = Math.max(...APPS_WEBSITES.map((a) => a.minutes))

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!running || paused) return
    const id = setInterval(() => setTimerSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running, paused])

  const isActive = running && !paused
  const activeTask = tasks.find((t) => t.active)

  const handlePlay = () => {
    if (!running) {
      setRunning(true)
      setPaused(false)
    } else if (paused) {
      setPaused(false)
    }
  }

  const handlePause = () => {
    if (running) setPaused(true)
  }

  const handleStop = () => {
    setRunning(false)
    setPaused(false)
    setTimerSeconds(0)
  }

  const handleReset = () => {
    setRunning(false)
    setPaused(false)
    setTimerSeconds(0)
  }

  const toggleTaskVisibility = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: !t.visible } : t)),
    )
  }

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const setSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const card = 'rounded-2xl border border-[#27272a]/80 bg-[#141416]'

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#050506] px-4 py-10">
      <div className="w-[380px] shrink-0">
        <div className="flex h-[26px] items-center justify-between rounded-t-2xl border border-b-0 border-[#27272a]/80 bg-[#1c1c1e] px-3">
          <div className="flex items-center gap-2">
            <div className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-gradient-to-br from-[#ff6b2c] to-[#ea580c] text-[9px] font-bold text-white">
              M
            </div>
            <span className="text-[11px] font-medium text-[#e4e4e7]">Monitask</span>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-[#71717a]">
            {clock}
          </span>
        </div>

        <div
          className="overflow-hidden rounded-b-2xl border border-[#27272a]/80 bg-[#0a0a0b] shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
          style={{ width: 380 }}
        >
          <header className="border-b border-[#1f1f22] px-4 pb-3 pt-3.5">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-[17px] font-semibold tracking-tight text-white">
                Monitask
              </h1>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Refresh"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] hover:bg-[#27272a] hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] hover:bg-[#27272a] hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Settings"
                  onClick={() => setTab('settings')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] hover:bg-[#27272a] hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-0.5 rounded-xl bg-[#18181b] p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex-1 rounded-[10px] py-1.5 text-[12px] font-medium transition-all',
                    tab === t.id
                      ? 'bg-[#27272a] text-white shadow-sm'
                      : 'text-[#71717a] hover:text-[#d4d4d8]',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </header>

          <div className="max-h-[560px] overflow-y-auto px-4 py-4">
            {tab === 'tracker' && (
              <div key="tracker" className="tab-panel-enter space-y-3">
                <p className="text-[12px] text-[#71717a]">
                  Week:{' '}
                  <span className="font-mono font-medium text-[#e4e4e7]">
                    00h 48m
                  </span>
                </p>

                {/* Timer card — timeMaster style */}
                <div className={cn(card, 'p-4')}>
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className={cn(
                        'font-mono text-[44px] font-light leading-none tabular-nums tracking-tight',
                        isActive ? 'text-[#ff6b2c]' : 'text-[#ff6b2c]/90',
                      )}
                    >
                      {formatTimerShort(timerSeconds)}
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      aria-label="Reset timer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#27272a] text-[#a1a1aa] transition hover:bg-[#27272a] hover:text-white"
                    >
                      <RotateCcw className="h-[18px] w-[18px]" />
                    </button>
                  </div>

                  <select
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="mb-3 w-full cursor-pointer rounded-xl border border-[#27272a] bg-[#0c0c0e] px-3 py-2.5 text-[14px] text-white outline-none focus:border-[#ff6b2c]/40"
                  >
                    {PROJECTS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="What are you working on?"
                    className="mb-3 w-full resize-none rounded-xl border border-[#27272a] bg-[#0c0c0e] px-3 py-2.5 text-[13px] text-white placeholder:text-[#52525b] outline-none focus:border-[#ff6b2c]/40"
                  />

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handlePlay}
                      disabled={isActive}
                      className={cn(
                        'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium',
                        isActive
                          ? 'cursor-default bg-[#27272a] text-[#52525b]'
                          : 'bg-[#ff6b2c] text-white hover:bg-[#ea580c]',
                      )}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={handlePause}
                      disabled={!running || paused}
                      className={cn(
                        'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-medium',
                        !running || paused
                          ? 'cursor-default border-[#27272a] text-[#52525b]'
                          : 'border-[#3f3f46] text-white hover:bg-[#27272a]',
                      )}
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pause
                    </button>
                    {isActive && (
                      <button
                        type="button"
                        onClick={handleStop}
                        aria-label="Stop"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ef4444] text-white"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                      </button>
                    )}
                  </div>

                  {activeTask && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0c0c0e] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: activeTask.dotColor }}
                        />
                        <span className="text-[12px] text-[#e4e4e7]">
                          {activeTask.name}
                        </span>
                      </div>
                      <span className="rounded-md bg-[#ff6b2c]/15 px-2 py-0.5 text-[10px] font-medium text-[#ff8c5a]">
                        Active
                      </span>
                    </div>
                  )}
                </div>

                {/* Session stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={cn(card, 'flex items-center gap-2.5 px-3 py-3')}>
                    <AlarmClock className="h-5 w-5 shrink-0 text-[#60a5fa]" />
                    <div>
                      <p className="text-[11px] text-[#71717a]">Work started</p>
                      <p className="text-[14px] font-medium text-white">8:55 am</p>
                    </div>
                  </div>
                  <div className={cn(card, 'flex items-center gap-2.5 px-3 py-3')}>
                    <Clock className="h-5 w-5 shrink-0 text-[#4ade80]" />
                    <div>
                      <p className="text-[11px] text-[#71717a]">Total hours</p>
                      <p className="font-mono text-[14px] font-medium tabular-nums text-white">
                        {formatTimerLong(5 * 3600 + 14 * 60 + 17)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity chart */}
                <div className={cn(card, 'px-3 py-4')}>
                  <div className="mb-2 flex h-16 items-end justify-between gap-1">
                    {ACTIVITY_BARS.map((h, i) => (
                      <div
                        key={ACTIVITY_LABELS[i]}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div
                          className="w-full max-w-[28px] rounded-sm bg-[#3b82f6]"
                          style={{
                            height: `${Math.max(4, h * 56)}px`,
                            opacity: 0.35 + h * 0.65,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-[#52525b]">
                    {ACTIVITY_LABELS.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </div>
                </div>

                {/* Apps & Websites — NEW v2 */}
                <div className={cn(card, 'p-3')}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold text-white">
                      Apps &amp; Websites
                    </h2>
                    <button
                      type="button"
                      aria-label="More options"
                      className="text-[#71717a] hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="space-y-3">
                    {APPS_WEBSITES.map((app) => (
                      <li key={app.name}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="text-[13px] text-[#e4e4e7]">
                            {app.name}
                          </span>
                          <span className="shrink-0 font-mono text-[12px] tabular-nums text-[#a1a1aa]">
                            {app.duration}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#27272a]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(app.minutes / maxAppMinutes) * 100}%`,
                              backgroundColor: app.color,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-[#71717a] uppercase">
                    Notes / Comments
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note…"
                      className="min-w-0 flex-1 rounded-xl border border-[#27272a] bg-[#141416] px-3 py-2 text-[13px] text-white outline-none focus:border-[#ff6b2c]/40"
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-xl bg-[#ff6b2c] px-4 text-[13px] font-medium text-white hover:bg-[#ea580c]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-[#71717a] uppercase">
                    Tasks
                  </h3>
                  <ul className="space-y-1.5">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-3 py-2.5',
                          task.active
                            ? 'border border-[#ff6b2c]/30 bg-[#ff6b2c]/10'
                            : 'bg-[#141416] hover:bg-[#18181b]',
                        )}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: task.dotColor }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[#e4e4e7]">
                          {task.name}
                        </span>
                        <span className="font-mono text-[12px] tabular-nums text-[#71717a]">
                          {task.time}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleTaskVisibility(task.id)}
                          aria-label={
                            task.visible ? 'Hide screenshots' : 'Show screenshots'
                          }
                          className="text-[#52525b] hover:text-[#a1a1aa]"
                        >
                          {task.visible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          aria-label="Delete task"
                          className="text-[#52525b] hover:text-[#ef4444]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === 'week' && (
              <div key="week" className="tab-panel-enter space-y-3">
                <p className="text-[14px] font-medium text-white">This week</p>
                <ul className="space-y-2">
                  {WEEK_DAYS.map((day) => (
                    <li
                      key={day.date}
                      className={cn(
                        card,
                        'flex items-center justify-between px-3.5 py-3',
                      )}
                    >
                      <span className="text-[13px] text-[#e4e4e7]">{day.date}</span>
                      <span className="font-mono text-[13px] tabular-nums text-[#71717a]">
                        {day.time}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className={cn(card, 'px-3 py-3 text-center')}>
                  <p className="text-[12px] text-[#71717a]">
                    Week:{' '}
                    <span className="font-mono font-semibold text-white">
                      00h 48m
                    </span>
                  </p>
                </div>
                <p className="text-center text-[11px] text-[#52525b]">
                  Time updates each 10 minutes
                </p>
              </div>
            )}

            {tab === 'manual' && (
              <div key="manual" className="tab-panel-enter space-y-4">
                <p className="text-[13px] text-[#71717a]">Add manual time entry</p>
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-[#71717a] uppercase">
                      Date
                    </span>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full rounded-xl border border-[#27272a] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#ff6b2c]/40"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Stepper label="From" value={manualFrom} onChange={setManualFrom} />
                    <Stepper label="To" value={manualTo} onChange={setManualTo} />
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-[#71717a] uppercase">
                      Project
                    </span>
                    <select
                      value={manualProject}
                      onChange={(e) => setManualProject(e.target.value)}
                      className="w-full rounded-xl border border-[#27272a] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
                    >
                      {PROJECTS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-medium text-[#71717a] uppercase">
                      Task
                    </span>
                    <select
                      value={manualTask}
                      onChange={(e) => setManualTask(e.target.value)}
                      className="w-full rounded-xl border border-[#27272a] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
                    >
                      {TASKS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="w-full rounded-xl bg-[#ff6b2c] py-2.5 text-[14px] font-semibold text-white hover:bg-[#ea580c]"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div key="settings" className="tab-panel-enter space-y-4">
                <ul className="space-y-3">
                  {(
                    [
                      ['runOnStart', 'Run when computer starts'],
                      ['notifySnapshots', 'Notify when snapshots are taken'],
                      ['keepIdle', 'Keep idle time by default'],
                      ['lastScreenshot', 'Display Last Screenshot'],
                      ['playSound', 'Play sound'],
                    ] as const
                  ).map(([key, label]) => (
                    <li
                      key={key}
                      className={cn(
                        card,
                        'flex items-center justify-between gap-3 px-3 py-2.5',
                      )}
                    >
                      <span className="text-[13px] text-[#e4e4e7]">{label}</span>
                      <div className="flex items-center gap-2">
                        {key === 'playSound' && settings.playSound && (
                          <button
                            type="button"
                            className="text-[11px] font-medium text-[#ff6b2c] hover:underline"
                          >
                            Test it out!
                          </button>
                        )}
                        <Toggle
                          label={label}
                          on={settings[key]}
                          onChange={(v) => setSetting(key, v)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[#71717a] uppercase">
                    Language
                  </span>
                  <select
                    value={settings.language}
                    onChange={(e) => setSetting('language', e.target.value)}
                    className="w-full rounded-xl border border-[#27272a] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
                  >
                    <option>English</option>
                    <option>Ukrainian</option>
                    <option>German</option>
                  </select>
                </label>
                <div
                  className={cn(
                    card,
                    'flex items-center justify-between px-3 py-2.5',
                  )}
                >
                  <span className="text-[13px] text-[#e4e4e7]">DownTime</span>
                  <div className="flex items-center gap-1 rounded-xl border border-[#27272a] bg-[#0c0c0e] p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setSetting('downtime', Math.max(1, settings.downtime - 1))
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#71717a] hover:bg-[#27272a]"
                    >
                      −
                    </button>
                    <span className="min-w-[28px] text-center font-mono text-[14px] text-white">
                      {settings.downtime}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSetting('downtime', Math.min(60, settings.downtime + 1))
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#71717a] hover:bg-[#27272a]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-[#27272a] py-2.5 text-[13px] font-medium text-[#a1a1aa] hover:bg-[#18181b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-[#ff6b2c] py-2.5 text-[13px] font-semibold text-white hover:bg-[#ea580c]"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {tab === 'tracker' && (
            <footer className="flex items-center justify-between border-t border-[#1f1f22] px-4 py-2.5">
              <span className="text-[11px] text-[#52525b]">
                Last sync: May 22 6:55 PM
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#71717a]">
                <span className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                Online
              </span>
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}

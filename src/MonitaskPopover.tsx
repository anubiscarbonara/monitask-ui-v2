import { useEffect, useState } from 'react'
import {
  AlarmClock,
  Bell,
  Clock,
  Eye,
  EyeOff,
  History,
  LayoutGrid,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings,
  Square,
  FileText,
  X,
  ChevronRight,
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

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'tracker', label: 'Track', icon: <LayoutGrid className="h-5 w-5" /> },
  { id: 'week', label: 'History', icon: <History className="h-5 w-5" /> },
  { id: 'manual', label: 'Logs', icon: <FileText className="h-5 w-5" /> },
  { id: 'settings', label: 'Config', icon: <Settings className="h-5 w-5" /> },
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
  { name: 'Code', duration: '1h 24m', minutes: 84, color: '#8B5CF6' },
  { name: 'Notion', duration: '55m', minutes: 55, color: '#FB7185' },
  { name: 'Zoom', duration: '41m', minutes: 41, color: '#34D399' },
  { name: 'Discord', duration: '38m', minutes: 38, color: '#2DD4BF' },
  { name: 'x.com', duration: '12m', minutes: 12, color: '#F9A8D4' },
]

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
        'relative h-[24px] w-[42px] shrink-0 rounded-full transition-colors duration-200',
        on ? 'bg-[#8B5CF6]' : 'bg-[#1E293B]',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          on ? 'translate-x-[20px]' : 'translate-x-[2px]',
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
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1 rounded-xl bg-[#0F172A] p-1 ring-1 ring-[#1E293B]">
        <button
          type="button"
          onClick={() => bump(-1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#1E293B] hover:text-white"
        >
          −
        </button>
        <span className="min-w-[48px] flex-1 text-center font-mono text-[14px] tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => bump(1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#1E293B] hover:text-white"
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
      dotColor: '#8B5CF6',
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

  const surface = 'bg-[#0F172A]'
  const card = 'rounded-[24px] border border-[#1E293B] bg-[#1E293B]/40 backdrop-blur-md'

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#020617] px-4 py-10 font-sans">
      <div className="relative w-[360px] overflow-hidden rounded-[32px] border border-[#1E293B] bg-[#020617] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]">
        
        {/* Top Control Bar — NEW POSITION */}
        <div className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#1E293B]/80 p-1.5 backdrop-blur-xl ring-1 ring-white/10">
          <button
            onClick={handlePlay}
            disabled={isActive}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-all',
              isActive 
                ? 'bg-[#1E293B] text-[#475569]' 
                : 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
            )}
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
          <button
            onClick={handlePause}
            disabled={!running || paused}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-all',
              !running || paused
                ? 'text-[#475569]'
                : 'bg-[#1E293B] text-white hover:bg-[#334155]'
            )}
          >
            <Pause className="h-4 w-4" />
          </button>
          {running && (
            <button
              onClick={handleStop}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          )}
        </div>

        {/* Dynamic Header */}
        <header className="flex h-[180px] flex-col items-center justify-end pb-6 pt-12 bg-gradient-to-b from-[#8B5CF6]/20 to-transparent">
          <div className="text-center">
            <div className={cn(
              "font-mono text-[56px] font-extralight tracking-tighter tabular-nums leading-none",
              isActive ? "text-white" : "text-[#94A3B8]"
            )}>
              {formatTimerShort(timerSeconds)}
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-[12px] font-medium text-[#8B5CF6]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
              {project}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="max-h-[480px] overflow-y-auto px-5 pb-24">
          <div className="space-y-6">
            
            {tab === 'tracker' && (
              <div className="tab-panel-enter space-y-6">
                
                {/* Tasks — MOVED UP */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B]">Active Tasks</h3>
                    <button className="text-[11px] font-semibold text-[#8B5CF6]">View All</button>
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className={cn(
                        "group flex items-center gap-3 rounded-2xl p-3 transition-all",
                        task.active ? "bg-[#8B5CF6]/10 ring-1 ring-[#8B5CF6]/30" : "bg-[#1E293B]/40 hover:bg-[#1E293B]/60"
                      )}>
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: task.dotColor }} />
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-[13px] font-medium text-white">{task.name}</p>
                          <p className="text-[11px] text-[#64748B]">{task.time} logged</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => toggleTaskVisibility(task.id)} className="p-1 text-[#64748B] hover:text-white">
                            {task.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button onClick={() => removeTask(task.id)} className="p-1 text-[#64748B] hover:text-[#EF4444]">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {task.active && <ChevronRight className="h-4 w-4 text-[#8B5CF6]" />}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Stats Grid — REDESIGNED */}
                <section className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-4 ring-1 ring-white/5">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
                      <AlarmClock className="h-4 w-4" />
                    </div>
                    <p className="text-[11px] text-[#64748B]">Started</p>
                    <p className="text-[15px] font-semibold text-white">8:55 AM</p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-4 ring-1 ring-white/5">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981]/10 text-[#10B981]">
                      <Clock className="h-4 w-4" />
                    </div>
                    <p className="text-[11px] text-[#64748B]">Total Today</p>
                    <p className="text-[15px] font-semibold text-white">5h 14m</p>
                  </div>
                </section>

                {/* Notes Input — REDESIGNED */}
                <section className="rounded-[24px] bg-[#1E293B]/30 p-1 ring-1 ring-white/5">
                  <div className="flex items-center gap-2 p-1">
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 bg-transparent px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#475569]"
                    />
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-lg">
                      <X className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                </section>

                {/* Apps List — COMPACT */}
                <section className={cn(card, "p-4")}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-white">Top Applications</h3>
                    <MoreVertical className="h-4 w-4 text-[#64748B]" />
                  </div>
                  <div className="space-y-4">
                    {APPS_WEBSITES.slice(0, 3).map((app) => (
                      <div key={app.name} className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0F172A]">
                          <div
                            className="h-full rounded-full"
                            style={{ 
                              width: `${(app.minutes / maxAppMinutes) * 100}%`,
                              backgroundColor: app.color 
                            }}
                          />
                        </div>
                        <span className="min-w-[50px] text-[11px] font-medium text-[#94A3B8]">{app.name}</span>
                        <span className="min-w-[40px] text-right font-mono text-[11px] text-white">{app.duration}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {tab === 'week' && (
              <div className="tab-panel-enter space-y-4">
                <h3 className="text-[18px] font-semibold text-white">Weekly Activity</h3>
                <div className="space-y-2">
                  {WEEK_DAYS.map((day) => (
                    <div key={day.date} className="flex items-center justify-between rounded-2xl bg-[#1E293B]/40 p-4">
                      <span className="text-[14px] text-white">{day.date}</span>
                      <span className="font-mono text-[14px] text-[#8B5CF6]">{day.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'manual' && (
              <div className="tab-panel-enter space-y-5">
                <h3 className="text-[18px] font-semibold text-white">Manual Entry</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Stepper label="From" value={manualFrom} onChange={setManualFrom} />
                    <Stepper label="To" value={manualTo} onChange={setManualTo} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#64748B] uppercase">Project</label>
                    <select className="w-full rounded-xl bg-[#0F172A] p-3 text-[14px] text-white ring-1 ring-[#1E293B]">
                      {PROJECTS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <button className="w-full rounded-2xl bg-[#8B5CF6] py-3.5 text-[14px] font-bold text-white shadow-xl shadow-[#8B5CF6]/20">
                    Add Time Entry
                  </button>
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div className="tab-panel-enter space-y-4">
                <h3 className="text-[18px] font-semibold text-white">Settings</h3>
                <div className="rounded-2xl bg-[#1E293B]/40 p-1">
                  {([
                    ['runOnStart', 'Launch on Startup'],
                    ['notifySnapshots', 'Snapshot Notifications'],
                    ['playSound', 'Audible Alerts'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-4">
                      <span className="text-[14px] text-[#CBD5E1]">{label}</span>
                      <Toggle label={label} on={settings[key]} onChange={(v) => setSetting(key, v)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>

        {/* Bottom Navigation — NEW LAYOUT */}
        <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-[#0F172A]/80 p-3 pb-6 backdrop-blur-xl border-t border-white/5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                tab === t.id ? "text-[#8B5CF6]" : "text-[#64748B] hover:text-[#94A3B8]"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                tab === t.id ? "bg-[#8B5CF6]/10 shadow-[inset_0_0_10px_rgba(139,92,246,0.1)]" : ""
              )}>
                {t.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer info — Tracker tab only */}
        {tab === 'tracker' && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center px-5">
            <div className="flex items-center gap-1.5 rounded-full bg-[#1E293B]/60 px-3 py-1 text-[10px] text-[#64748B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              Synced 2m ago
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

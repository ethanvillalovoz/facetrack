import { useCallback, useEffect, useState } from "react"
import {
  Check,
  Database,
  Download,
  Github,
  ImagePlus,
  LoaderCircle,
  Play,
  ScanFace,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from "lucide-react"
import "./App.css"
import DemoApiProvider from "./api/DemoApiProvider.jsx"
import LiveApiProvider from "./api/LiveApiProvider.jsx"
import { useApi } from "./api/api-context.js"

const runtimeMode = import.meta.env.VITE_FACETRACK_MODE === "live" ? "live" : "demo"
const Provider = runtimeMode === "live" ? LiveApiProvider : DemoApiProvider

function formatTimestamp(value) {
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return value
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp)
}

function AppHeader({ activeView, onViewChange, mode }) {
  const views = ["session", "roster", "attendance"]
  return (
    <header className="app-header">
      <a className="brand" href="#main" aria-label="FaceTrack workspace">
        <span className="brand-mark">FT</span>
        <span>
          <strong>FaceTrack</strong>
          <small>Local vision lab</small>
        </span>
      </a>
      <span className="runtime-badge"><i />{mode === "demo" ? "Synthetic demo" : "Local runtime"}</span>
      <nav aria-label="Workspace views">
        {views.map((view) => (
          <button
            className={activeView === view ? "nav-link is-active" : "nav-link"}
            key={view}
            onClick={() => onViewChange(view)}
            type="button"
          >
            {view}
          </button>
        ))}
      </nav>
      <a
        className="repository-link"
        href="https://github.com/ethanvillalovoz/facetrack"
        rel="noreferrer"
        target="_blank"
      >
        <Github aria-hidden="true" size={15} />
        Repository
      </a>
    </header>
  )
}

const markers = [
  { initials: "AC", label: "Ava Chen", left: "15%", top: "22%", matched: true },
  { initials: "JL", label: "Jordan Lee", left: "42%", top: "30%", matched: true },
  { initials: "MP", label: "Mina Patel", left: "68%", top: "19%", matched: true },
  { initials: "?", label: "Unknown", left: "76%", top: "57%", matched: false },
]

function VisionFrame({ status }) {
  return (
    <div className={`vision-frame is-${status}`} aria-label="Synthetic session frame with four detections">
      <div className="frame-meta">
        <span>Session 04 / Frame 02</span>
        <span>1920 x 1080</span>
      </div>
      <div className="room-line room-line-one" />
      <div className="room-line room-line-two" />
      {markers.map((marker) => (
        <div
          className={`face-marker ${marker.matched ? "is-match" : "is-unknown"}`}
          key={marker.label}
          style={{ "--marker-left": marker.left, "--marker-top": marker.top }}
        >
          <span className="face-avatar">{marker.initials}</span>
          <span className="face-label">
            {status === "complete" ? marker.label : status === "processing" ? "Comparing" : "Candidate"}
          </span>
        </div>
      ))}
      {status === "processing" ? <div className="scan-line" /> : null}
      <div className="frame-footer">
        <span><i /> Consent-safe synthetic frame</span>
        <span>Threshold 0.48</span>
      </div>
    </div>
  )
}

function Metric({ label, value, detail }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

function SessionView({ rosterCount, onAttendanceChanged }) {
  const api = useApi()
  const [status, setStatus] = useState("ready")
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState("")
  const [frameCount, setFrameCount] = useState(api.mode === "demo" ? 2 : 0)
  const [uploadMessage, setUploadMessage] = useState("")

  const runSession = async () => {
    setStatus("processing")
    setError("")
    try {
      const result = await api.runRecognition()
      setSummary(result.summary)
      setStatus("complete")
      onAttendanceChanged()
    } catch (requestError) {
      setError(requestError.message)
      setStatus("ready")
    }
  }

  const stageFrame = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadMessage("Staging frame")
    try {
      await api.uploadFrame(file)
      setFrameCount((count) => count + 1)
      setUploadMessage(`${file.name} staged`)
      setSummary(null)
      setStatus("ready")
    } catch (requestError) {
      setUploadMessage(requestError.message)
    }
  }

  const matches = summary?.matches ?? []
  return (
    <main id="main" className="page-shell">
      <section className="page-intro" aria-labelledby="session-title">
        <div>
          <p className="eyebrow">01 / Recognition session</p>
          <h1 id="session-title">Inspect the match, not just the outcome.</h1>
          <p>Stage consented frames, run one bounded comparison, then review every identity decision.</p>
        </div>
        <div className="privacy-callout">
          <ShieldCheck aria-hidden="true" size={17} />
          <span><strong>Local-first</strong> Session frames are deleted after processing.</span>
        </div>
      </section>

      <section className="metrics-strip" aria-label="Session metrics">
        <Metric label="Reference roster" value={rosterCount} detail="identities ready" />
        <Metric label="Session input" value={frameCount} detail="frames staged" />
        <Metric label="Match threshold" value="0.48" detail="face distance" />
        <Metric label="Retention" value="0 h" detail="after processing" />
      </section>

      <section className="session-workspace">
        <div className="stage-column">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Session frame</p>
              <h2>Candidate detections</h2>
            </div>
            <label className="icon-command" htmlFor="session-frame">
              <ImagePlus aria-hidden="true" size={15} />
              Add frame
            </label>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="visually-hidden"
              id="session-frame"
              onChange={stageFrame}
              type="file"
            />
          </div>
          <VisionFrame status={status} />
          <p className="upload-status" aria-live="polite">{uploadMessage}</p>
        </div>

        <aside className="pipeline-panel" aria-labelledby="pipeline-title">
          <div className="section-heading compact">
            <div>
              <p className="section-kicker">Processing trace</p>
              <h2 id="pipeline-title">Recognition pipeline</h2>
            </div>
            <span className={`status-label is-${status}`}>{status}</span>
          </div>
          <ol className="pipeline-steps">
            {["Detect faces", "Encode descriptors", "Compare roster", "Deduplicate day"].map((step, index) => (
              <li className={status === "complete" ? "is-complete" : status === "processing" ? "is-active" : ""} key={step}>
                <span>{status === "complete" ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span>
                {step}
              </li>
            ))}
          </ol>

          {status === "complete" ? (
            <div className="match-summary" aria-live="polite">
              <div><strong>{matches.length}</strong><span>matched</span></div>
              <div><strong>{summary.unknown_faces}</strong><span>unknown</span></div>
              <div><strong>{summary.frames_processed}</strong><span>frames</span></div>
            </div>
          ) : (
            <p className="pipeline-note">Each face is compared against the reference roster. Unknowns remain unlabelled.</p>
          )}

          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <button className="primary-command" disabled={status === "processing" || frameCount === 0} onClick={runSession} type="button">
            {status === "processing" ? <LoaderCircle className="spin" size={16} /> : status === "complete" ? <Play size={16} /> : <ScanFace size={16} />}
            {status === "processing" ? "Comparing faces" : status === "complete" ? "Run again" : "Run recognition"}
          </button>
          <p className="mode-note">{api.mode === "demo" ? "Synthetic identities and deterministic decisions." : "Native face_recognition runtime."}</p>
        </aside>
      </section>
    </main>
  )
}

function RosterView({ roster, onRosterChanged }) {
  const api = useApi()
  const [label, setLabel] = useState("")
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState("")

  const addIdentity = async (event) => {
    event.preventDefault()
    if (!label.trim() || !file) return
    setStatus("Normalizing reference image")
    try {
      await api.uploadReference(label, file)
      setLabel("")
      setFile(null)
      setStatus("Identity added")
      onRosterChanged()
    } catch (requestError) {
      setStatus(requestError.message)
    }
  }

  return (
    <main id="main" className="page-shell">
      <section className="page-intro" aria-labelledby="roster-title">
        <div>
          <p className="eyebrow">02 / Reference roster</p>
          <h1 id="roster-title">Keep identity enrollment explicit.</h1>
          <p>Every reference has a human-readable label and one normalized, metadata-free image.</p>
        </div>
        <div className="privacy-callout"><Users size={17} /><span><strong>{roster.length} identities</strong> available to local matching.</span></div>
      </section>
      <section className="roster-layout">
        <div className="roster-list" aria-label="Reference identities">
          <div className="section-heading">
            <div><p className="section-kicker">Enrolled identities</p><h2>Reference quality</h2></div>
            <span>{roster.length} total</span>
          </div>
          {roster.map((identity) => (
            <div className="identity-row" key={identity.id}>
              <span className="identity-avatar">{identity.label.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <div><strong>{identity.label}</strong><small>{identity.quality || "Reference ready"}</small></div>
              <span className="ready-state"><i /> Ready</span>
            </div>
          ))}
        </div>
        <form className="enrollment-form" onSubmit={addIdentity}>
          <p className="section-kicker">Add reference</p>
          <h2>Enroll an identity</h2>
          <label htmlFor="identity-label">Display label</label>
          <input id="identity-label" maxLength="80" onChange={(event) => setLabel(event.target.value)} placeholder="Ava Chen" value={label} />
          <label className="file-drop" htmlFor="identity-image">
            <Upload size={18} />
            <span><strong>{file ? file.name : "Choose reference image"}</strong><small>JPEG, PNG, or WebP up to 8 MB</small></span>
          </label>
          <input accept="image/jpeg,image/png,image/webp" className="visually-hidden" id="identity-image" onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" />
          <button className="primary-command" disabled={!label.trim() || !file} type="submit"><Users size={16} /> Add to roster</button>
          <p className="form-status" aria-live="polite">{status}</p>
        </form>
      </section>
    </main>
  )
}

function AttendanceView({ attendance, onAttendanceChanged }) {
  const api = useApi()
  const [status, setStatus] = useState("")
  const [confirmClear, setConfirmClear] = useState(false)

  const exportCsv = async () => {
    setStatus("Preparing CSV")
    try {
      const blob = await api.downloadAttendance()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "facetrack-attendance.csv"
      link.click()
      URL.revokeObjectURL(url)
      setStatus("CSV downloaded")
    } catch (requestError) {
      setStatus(requestError.message)
    }
  }

  const clearRecords = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setStatus("Select confirm clear to remove every local record")
      return
    }
    try {
      await api.clearAttendance()
      setStatus("Attendance cleared")
      setConfirmClear(false)
      onAttendanceChanged()
    } catch (requestError) {
      setStatus(requestError.message)
    }
  }

  return (
    <main id="main" className="page-shell">
      <section className="page-intro attendance-intro" aria-labelledby="attendance-title">
        <div>
          <p className="eyebrow">03 / Attendance ledger</p>
          <h1 id="attendance-title">Review the record behind each match.</h1>
          <p>Daily deduplication keeps one local attendance event per recognized identity.</p>
        </div>
        <div className="table-actions">
          <button className="secondary-command" disabled={!attendance.length} onClick={exportCsv} type="button"><Download size={15} /> Export CSV</button>
          <button className="danger-command" disabled={!attendance.length} onClick={clearRecords} type="button"><Trash2 size={15} /> {confirmClear ? "Confirm clear" : "Clear"}</button>
        </div>
      </section>
      <section className="attendance-table" aria-label="Attendance records">
        <div className="table-head"><span>Identity</span><span>Observed at</span><span>Decision</span></div>
        {attendance.length ? attendance.map((record) => (
          <div className="table-row" key={record.id}>
            <span><i>{record.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><strong>{record.name}</strong></span>
            <time dateTime={record.timestamp}>{formatTimestamp(record.timestamp)}</time>
            <span className="decision-state"><Check size={13} /> Matched</span>
          </div>
        )) : <div className="empty-ledger"><Database size={20} /><p>No attendance records in this local session.</p></div>}
      </section>
      <p className="form-status" aria-live="polite">{status}</p>
    </main>
  )
}

function Workspace() {
  const api = useApi()
  const [activeView, setActiveView] = useState("session")
  const [roster, setRoster] = useState([])
  const [attendance, setAttendance] = useState([])
  const [workspaceError, setWorkspaceError] = useState("")

  const refreshRoster = useCallback(async () => {
    try {
      const response = await api.getRoster()
      setRoster(response.roster || [])
    } catch (requestError) {
      setWorkspaceError(requestError.message)
    }
  }, [api])

  const refreshAttendance = useCallback(async () => {
    try {
      const response = await api.getAttendance()
      setAttendance(response.attendance || [])
    } catch (requestError) {
      setWorkspaceError(requestError.message)
    }
  }, [api])

  const changeView = (view) => {
    setActiveView(view)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [activeView])

  useEffect(() => {
    refreshRoster()
    refreshAttendance()
  }, [refreshAttendance, refreshRoster])

  return (
    <div className="app-shell">
      <AppHeader activeView={activeView} mode={api.mode} onViewChange={changeView} />
      {workspaceError ? <div className="connection-banner" role="alert">{workspaceError}</div> : null}
      {activeView === "session" ? <SessionView onAttendanceChanged={refreshAttendance} rosterCount={roster.length} /> : null}
      {activeView === "roster" ? <RosterView onRosterChanged={refreshRoster} roster={roster} /> : null}
      {activeView === "attendance" ? <AttendanceView attendance={attendance} onAttendanceChanged={refreshAttendance} /> : null}
      <footer className="app-footer"><span>FaceTrack / local reference implementation</span><span>Consent required for every image</span></footer>
    </div>
  )
}

export default function App() {
  return <Provider><Workspace /></Provider>
}

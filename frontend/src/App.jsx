import { useCallback, useEffect, useState } from "react"
import {
  Check,
  Database,
  DownloadSimple,
  GithubLogo,
  ImageSquare,
  SpinnerGap,
  Play,
  Scan,
  ScanSmiley,
  ShieldCheck,
  Trash,
  UploadSimple,
  Users,
} from "@phosphor-icons/react"
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

function AppHeader({ activeView, onViewChange }) {
  const views = ["session", "roster", "attendance"]
  return (
    <header className="app-header">
      <a className="brand" href="#main" aria-label="FaceTrack workspace">
        <span className="brand-sensor" aria-hidden="true"><ScanSmiley size={22} /></span>
        <span>
          <strong>FaceTrack</strong>
          <small>Local-first face recognition</small>
        </span>
      </a>
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
        <GithubLogo aria-hidden="true" size={17} />
        Repository
      </a>
    </header>
  )
}

const markers = [
  { index: "1", initials: "AC", label: "Ava Chen", left: "13%", top: "21%", width: "15%", height: "31%", matched: true },
  { index: "2", initials: "JL", label: "Jordan Lee", left: "47%", top: "27%", width: "13%", height: "30%", matched: true },
  { index: "3", initials: "MP", label: "Mina Patel", left: "71%", top: "23%", width: "14%", height: "30%", matched: true },
  { index: "4", initials: "?", label: "Unknown", left: "43%", top: "13%", width: "9%", height: "20%", matched: false },
]

function VisionFrame({ imageSrc, onSelect, selectedIndex, status }) {
  return (
    <figure className={`vision-frame is-${status}${imageSrc ? " has-image" : ""}`} aria-label={imageSrc ? "Uploaded session frame" : "Bundled consent-safe classroom frame with four detections"}>
      <div className="frame-canvas">
        <img
          className="frame-image"
          src={imageSrc || "/demo-session.webp"}
          alt={imageSrc ? "Frame staged for local recognition" : "Four fictional students working in a computer science classroom"}
        />
        {!imageSrc ? markers.map((marker) => (
          <button
            aria-label={`Inspect detection ${marker.index}: ${marker.label}`}
            aria-pressed={selectedIndex === marker.index}
            className={`face-marker ${marker.matched ? "is-match" : "is-unknown"}${selectedIndex === marker.index ? " is-selected" : ""}`}
            key={marker.index}
            onClick={() => onSelect(marker.index)}
            style={{
              "--marker-height": marker.height,
              "--marker-left": marker.left,
              "--marker-top": marker.top,
              "--marker-width": marker.width,
            }}
          >
            <span className="marker-index">{marker.index}</span>
            {status !== "ready" ? (
              <span className="face-label">
                {status === "complete" ? marker.initials : "..."}
              </span>
            ) : null}
          </button>
        )) : null}
      </div>
      <figcaption className="frame-footer">
        <span>2026-07-14&nbsp;&nbsp;09:41:32</span>
        <span>Camera: bundled demo</span>
        <span>1280 x 720</span>
        <span>Threshold: 0.48</span>
      </figcaption>
    </figure>
  )
}

const pipelineSteps = ["Detect faces", "Encode descriptors", "Compare roster", "Attendance decision"]

function SessionView({ roster, onAttendanceChanged }) {
  const api = useApi()
  const [status, setStatus] = useState("ready")
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState("")
  const [frameCount, setFrameCount] = useState(api.mode === "demo" ? 2 : 0)
  const [framePreview, setFramePreview] = useState("")
  const [selectedIndex, setSelectedIndex] = useState("1")
  const [uploadMessage, setUploadMessage] = useState("")

  useEffect(() => () => {
    if (framePreview) URL.revokeObjectURL(framePreview)
  }, [framePreview])

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
      setFramePreview(URL.createObjectURL(file))
      setFrameCount((count) => count + 1)
      setUploadMessage(`${file.name} staged`)
      setSummary(null)
      setStatus("ready")
    } catch (requestError) {
      setUploadMessage(requestError.message)
    }
  }

  const matches = summary?.matches ?? []
  const ledgerRows = markers.map((marker, index) => {
    const identity = roster[index]?.label || marker.label
    const match = marker.matched ? matches.find((item) => item.name === identity) : null
    return {
      ...marker,
      distance: match?.distance,
      identity,
      state: status === "complete" ? marker.matched ? "present" : "unknown" : "pending",
    }
  })
  const selectedRow = ledgerRows.find((row) => row.index === selectedIndex) || ledgerRows[0]
  return (
    <main id="main" className="page-shell">
      <section className="session-header" aria-labelledby="session-title">
        <div>
          <h1 id="session-title">Recognition session</h1>
          <p>Stage consented frames and inspect every local match decision.</p>
        </div>
        <div className="privacy-callout">
          <ShieldCheck aria-hidden="true" size={17} />
          <span><strong>Local-first:</strong> processing stays on this device. Frames are not uploaded.</span>
        </div>
      </section>

      <ol className={`recognition-progress is-${status}`} aria-label="Recognition progress">
        {pipelineSteps.map((step, index) => (
          <li className={status === "complete" ? "is-complete" : status === "processing" ? "is-processing" : index === 0 ? "is-current" : ""} key={step}>
            <span>{status === "complete" ? <Check size={13} weight="bold" /> : index + 1}</span>
            <strong>{step}</strong>
          </li>
        ))}
      </ol>

      <section className="session-workspace">
        <div className="frame-panel">
          <div className="panel-heading">
            <p><span>Session frame</span><small>{frameCount} staged</small></p>
            <label className="icon-command" htmlFor="session-frame">
              <ImageSquare aria-hidden="true" size={17} />
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
          <VisionFrame
            imageSrc={framePreview}
            onSelect={setSelectedIndex}
            selectedIndex={selectedIndex}
            status={status}
          />
          <p className="upload-status" aria-live="polite">{uploadMessage}</p>
        </div>

        <aside className="match-ledger" aria-labelledby="ledger-title">
          <div className="panel-heading ledger-heading">
            <p><span id="ledger-title">Match ledger</span><small>{status === "complete" ? `${summary.faces_detected} faces detected` : "Awaiting decision"}</small></p>
            <span className={`status-label is-${status}`}>{status}</span>
          </div>
          <div className="ledger-columns" aria-hidden="true"><span>#</span><span>Identity</span><span>Distance</span><span>Decision</span></div>
          <ol className="ledger-rows">
            {ledgerRows.map((row) => (
              <li key={row.index}>
                <button
                  aria-pressed={selectedIndex === row.index}
                  className={`ledger-row is-${row.state}${selectedIndex === row.index ? " is-selected" : ""}`}
                  onClick={() => setSelectedIndex(row.index)}
                  type="button"
                >
                  <span>{row.index}</span>
                  <span className="ledger-identity"><i>{row.initials}</i><strong>{row.identity}</strong></span>
                  <code>{row.distance === undefined ? "—" : row.distance.toFixed(3)}</code>
                  <span className="ledger-decision">
                    {row.state === "present" ? <Check size={14} weight="bold" /> : null}
                    {row.state === "present" ? "Present" : row.state === "unknown" ? "Not recognized" : "Pending"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="ledger-actions">
            <p className="selection-readout" aria-live="polite">
              <span>Detection {selectedRow.index}</span>
              <strong>{selectedRow.identity}</strong>
              <small>
                {selectedRow.state === "unknown"
                  ? `No roster match met the ${summary.distance_threshold.toFixed(2)} distance threshold.`
                  : selectedRow.distance === undefined
                  ? "Select a detection now; run recognition to inspect its distance."
                  : `${selectedRow.distance.toFixed(3)} distance against a ${summary.distance_threshold.toFixed(2)} threshold.`}
              </small>
            </p>
            {status === "complete" ? (
              <div className="match-summary">
                <div><strong>{matches.length}</strong><span>present</span></div>
                <div><strong>{summary.unknown_faces}</strong><span>unknown</span></div>
              </div>
            ) : <p className="pipeline-note">Run locally to compare this frame with {roster.length} reference identities.</p>}
            {error ? <p className="error-message" role="alert">{error}</p> : null}
            <button className="primary-command" disabled={status === "processing" || frameCount === 0} onClick={runSession} type="button">
              {status === "processing" ? <SpinnerGap className="spin" size={17} /> : status === "complete" ? <Play size={17} /> : <Scan size={17} />}
              {status === "processing" ? "Comparing faces" : status === "complete" ? "Run again" : "Run recognition"}
            </button>
            <p className="mode-note">{api.mode === "demo" ? "Bundled demo; decisions are not stored" : "Native face_recognition runtime"}</p>
          </div>
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
            <UploadSimple size={18} />
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
          <button className="secondary-command" disabled={!attendance.length} onClick={exportCsv} type="button"><DownloadSimple size={15} /> Export CSV</button>
          <button className="danger-command" disabled={!attendance.length} onClick={clearRecords} type="button"><Trash size={15} /> {confirmClear ? "Confirm clear" : "Clear"}</button>
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
      <AppHeader activeView={activeView} onViewChange={changeView} />
      {workspaceError ? <div className="connection-banner" role="alert">{workspaceError}</div> : null}
      {activeView === "session" ? <SessionView onAttendanceChanged={refreshAttendance} roster={roster} /> : null}
      {activeView === "roster" ? <RosterView onRosterChanged={refreshRoster} roster={roster} /> : null}
      {activeView === "attendance" ? <AttendanceView attendance={attendance} onAttendanceChanged={refreshAttendance} /> : null}
      <footer className="app-footer"><span>FaceTrack / {api.mode === "demo" ? "bundled demo" : "local runtime"}</span><span>Consent required for every image</span></footer>
    </div>
  )
}

export default function App() {
  return <Provider><Workspace /></Provider>
}

import { useMemo, useRef } from "react"
import { ApiContext } from "./api-context.js"
import { DEMO_ATTENDANCE, DEMO_ROSTER, DEMO_SUMMARY } from "../data/demo.js"

const wait = (duration = 180) => new Promise((resolve) => setTimeout(resolve, duration))

export default function DemoApiProvider({ children }) {
  const roster = useRef([...DEMO_ROSTER])
  const attendance = useRef([...DEMO_ATTENDANCE])

  const api = useMemo(() => ({
    mode: "demo",
    async getRoster() { await wait(); return { roster: [...roster.current] } },
    async getAttendance() { await wait(); return { attendance: [...attendance.current] } },
    async uploadReference(label) {
      await wait(350)
      roster.current = [...roster.current, { id: Date.now(), label, quality: "Reference ready" }]
      return { identity: roster.current.at(-1) }
    },
    async uploadFrame() { await wait(240); return { frame: { filename: "synthetic-frame.jpg" } } },
    async runRecognition() { await wait(950); return { summary: DEMO_SUMMARY } },
    async clearAttendance() { await wait(); const deleted = attendance.current.length; attendance.current = []; return { deleted } },
    async downloadAttendance() {
      await wait()
      const rows = ["name,timestamp", ...attendance.current.map((item) => `${item.name},${item.timestamp}`)]
      return new Blob([rows.join("\n")], { type: "text/csv" })
    },
  }), [])

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

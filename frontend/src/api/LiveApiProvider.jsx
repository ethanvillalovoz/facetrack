import { useMemo } from "react"
import { ApiContext } from "./api-context.js"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: AbortSignal.timeout(120_000),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.detail || "The local service could not complete that request")
    return payload
  } catch (error) {
    if (error instanceof Error && error.message !== "Failed to fetch") throw error
    throw new Error("The local FaceTrack API is unavailable", { cause: error })
  }
}

export default function LiveApiProvider({ children }) {
  const api = useMemo(() => ({
    mode: "live",
    getRoster: () => request("/roster/"),
    getAttendance: () => request("/attendance/"),
    uploadReference(label, file) {
      const body = new FormData()
      body.append("label", label)
      body.append("file", file)
      return request("/upload/known/", { method: "POST", body })
    },
    uploadFrame(file) {
      const body = new FormData()
      body.append("file", file)
      return request("/upload/batch/", { method: "POST", body })
    },
    runRecognition: () => request("/process/", { method: "POST" }),
    clearAttendance: () => request("/attendance/", { method: "DELETE" }),
    async downloadAttendance() {
      try {
        const response = await fetch(`${API_BASE_URL}/attendance/export/`)
        if (!response.ok) throw new Error("Attendance export failed")
        return response.blob()
      } catch (error) {
        if (error instanceof Error && error.message === "Attendance export failed") throw error
        throw new Error("The local FaceTrack API is unavailable", { cause: error })
      }
    },
  }), [])

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

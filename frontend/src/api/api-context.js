import { createContext, useContext } from "react"

export const ApiContext = createContext(null)

export function useApi() {
  const api = useContext(ApiContext)
  if (!api) throw new Error("FaceTrack API provider is missing")
  return api
}

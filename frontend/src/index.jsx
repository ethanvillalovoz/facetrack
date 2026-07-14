import React from "react"
import ReactDOM from "react-dom/client"
import "@fontsource/source-sans-3/latin-400.css"
import "@fontsource/source-sans-3/latin-600.css"
import "@fontsource/source-sans-3/latin-700.css"
import "@fontsource/source-code-pro/latin-400.css"
import "@fontsource/source-code-pro/latin-500.css"
import "./index.css"
import App from "./App.jsx"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

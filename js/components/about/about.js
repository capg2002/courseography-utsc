import React from "react"
import { createRoot } from "react-dom/client"
import aboutContent from "../../../README.md"

function AboutContent() {
  return (
    <div
      className="about-page"
      dangerouslySetInnerHTML={{ __html: aboutContent }}
    />
  )
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem("theme", theme)

  const btn = document.getElementById("theme-toggle")
  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙"
  }
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem("theme") || "light"
  applyTheme(savedTheme)

  const btn = document.getElementById("theme-toggle")
  if (!btn) {
    console.log("theme-toggle button not found")
    return
  }

  btn.onclick = () => {
    const current = document.documentElement.dataset.theme || "light"
    const next = current === "dark" ? "light" : "dark"
    applyTheme(next)
  }
}

const mountNode = document.getElementById("aboutDiv")
if (mountNode) {
  initThemeToggle()
  const root = createRoot(mountNode)
  root.render(<AboutContent />)
}
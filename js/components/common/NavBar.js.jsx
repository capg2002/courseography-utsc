import React, { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload } from "@fortawesome/free-solid-svg-icons"
import { Tooltip } from "react-tooltip"

/**
 * NavBar component.
 */
export function NavBar({ selected_page, open_modal }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("theme", theme)
  }, [theme])
  const isActive = page => (page === selected_page ? "selected-page" : undefined)

  return (
    <nav className="row header">
      {/* Courseography Logo (also functions as an additional link to graph page) */}
      <div className="nav-left">
        <a href="/graph">
          <img
            id="courseography-header"
            src="/static/res/img/logo.png"
            alt="Courseography"
            data-context={selected_page}
          />
        </a>
      </div>

      {/* Navigation links */}
      <div className="nav-middle">
        <ul id="nav-links">
          <li id="nav-graph" className={isActive("graph")}>
            <a href="/graph">Graph</a>
          </li>
          <li id="nav-grid" className={isActive("grid")}>
            <a href="/grid">Grid</a>
          </li>
          <li id="nav-generate" className={isActive("generate")}>
            <a href="/generate">Sample Program Journeys</a>
          </li>
          <li id="nav-about" className={isActive("about")}>
            <a href="/about">About</a>
          </li>
        </ul>
      </div>

      {/* Export button (graph/grid only) */}
      <div className="nav-right">

        {/* Dark mode toggle */}
        <button
          className="theme-toggle"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {(selected_page === "graph" || selected_page === "grid") && (
          <>
            <button
              id="nav-export"
              aria-label="Export"
              data-tooltip-content="Export"
              data-tooltip-id="Export"
              onClick={open_modal}
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>

            <Tooltip
              id="Export"
              className="export-tooltip"
              place="left"
              variant="float"
            />
          </>
        )}
      </div>
    </nav>
  )
}

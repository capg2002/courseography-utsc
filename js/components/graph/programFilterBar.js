import React, { useMemo, useState } from "react";
import { PROGRAM_CATALOG } from "./programKeys";

export default function ProgramFilterBar({
  activeProgramId,
  onSelectProgram,
  onClear,
}) {
  const [openCategory, setOpenCategory] = useState(null);

  // Build a quick lookup: id -> name (from PROGRAM_CATALOG)
  const programNameById = useMemo(() => {
    const map = {};
    for (const cat of PROGRAM_CATALOG) {
      for (const p of cat.programs) {
        map[p.id] = p.name;
      }
    }
    return map;
  }, []);

  const activeProgramName = activeProgramId ? programNameById[activeProgramId] : null;

  return (
    <div className="program-filter">
      <div className="program-filter__bar">
        <div className="program-filter__cats">
          {PROGRAM_CATALOG.map((cat) => (
            <button
              key={cat.category}
              type="button"
              className={`program-filter__btn ${openCategory === cat.category ? "is-active" : ""}`}
              onClick={() =>
                setOpenCategory(openCategory === cat.category ? null : cat.category)
              }
            >
              {cat.category}
            </button>
          ))}
        </div>

        <div className="program-filter__status">
          {activeProgramName ? (
            <>
              <span className="program-filter__label">{activeProgramName}</span>
              <button
                type="button"
                className="program-filter__clear"
                onClick={onClear}
              >
                Clear
              </button>
            </>
          ) : (
            <span className="program-filter__label">Choose a program</span>
          )}
        </div>
      </div>

      {openCategory && (
        <div className="program-filter__popover" role="dialog" aria-label="Choose program">
          <div className="program-filter__popoverHeader">
            <strong>{openCategory}</strong>
            <button type="button" onClick={() => setOpenCategory(null)}>✕</button>
          </div>

          <div className="program-filter__list">
            {PROGRAM_CATALOG
              .find((c) => c.category === openCategory)
              ?.programs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="program-filter__item"
                  onClick={() => onSelectProgram(p.id)}
                >
                  {p.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
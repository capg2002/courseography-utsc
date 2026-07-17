// import React from "react";

// export default function Legend({ categories, activeKeys, onToggle }) {
//   const keys = Array.isArray(activeKeys) ? activeKeys : [];
//   const [isMinimized, setIsMinimized] = React.useState(false);

//   // drag state
//   const legendRef = React.useRef(null);
//   const draggingRef = React.useRef(false);
//   const offsetRef = React.useRef({ x: 0, y: 0 });

//   // position state 
//   const [pos, setPos] = React.useState({ x: 24, y: 24 });

//   const onPointerDownHeader = (e) => {
//     // Only left mouse / primary pointer
//     if (e.button != null && e.button !== 0) return;

//     const el = legendRef.current;
//     if (!el) return;

//     draggingRef.current = true;

//     // Capture pointer so we still get events even if cursor leaves element
//     try {
//       e.currentTarget.setPointerCapture?.(e.pointerId);
//     } catch {}

//     const rect = el.getBoundingClientRect();
//     offsetRef.current = {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top,
//     };

//     e.preventDefault();
//   };

//   const onPointerMove = (e) => {
//     if (!draggingRef.current) return;

//     // Keep legend within viewport with a small margin
//     const el = legendRef.current;
//     if (!el) return;

//     const margin = 8;
//     const w = el.offsetWidth;
//     const h = el.offsetHeight;

//     let nextX = e.clientX - offsetRef.current.x;
//     let nextY = e.clientY - offsetRef.current.y;

//     const maxX = window.innerWidth - w - margin;
//     const maxY = window.innerHeight - h - margin;

//     nextX = Math.max(margin, Math.min(nextX, maxX));
//     nextY = Math.max(margin, Math.min(nextY, maxY));

//     setPos({ x: nextX, y: nextY });
//   };

//   const onPointerUp = (e) => {
//     if (!draggingRef.current) return;
//     draggingRef.current = false;

//     try {
//       e.currentTarget.releasePointerCapture?.(e.pointerId);
//     } catch {}
//   };

//   return (
//     <div
//       ref={legendRef}
//       className={"graph-legend" + (isMinimized ? " is-minimized" : "")}
//       style={{
//         position: "fixed",
//         left: `${pos.x}px`,
//         top: `${pos.y}px`,
//         zIndex: 9999,
//       }}
//     >
//       <div
//         className="graph-legend__header"
//         onPointerDown={onPointerDownHeader}
//         onPointerMove={onPointerMove}
//         onPointerUp={onPointerUp}
//         style={{ cursor: "grab", userSelect: "none", touchAction: "none" }}
//       >
//         <div className="graph-legend__title">Legend</div>

//         <button
//           type="button"
//           className="graph-legend__min-btn"
//           aria-expanded={!isMinimized}
//           aria-label={isMinimized ? "Expand legend" : "Minimize legend"}
//           onClick={() => setIsMinimized((v) => !v)}
//           // Prevent the button click from starting a drag
//           onPointerDown={(e) => e.stopPropagation()}
//         >
//           {isMinimized ? "▴" : "▾"}
//         </button>
//       </div>

//       {!isMinimized && (
//         <>
//           <div className="graph-legend__clear">
//             <button
//               type="button"
//               className="graph-legend__clear-btn"
//               disabled={keys.length === 0}
//               onClick={() => onToggle(null)}
//             >
//               Clear
//             </button>
//           </div>

//           <div className="graph-legend__list">
//             {categories.map((c) => (
//               <button
//                 key={c.key}
//                 type="button"
//                 className={
//                   "graph-legend__item" + (keys.includes(c.key) ? " is-active" : "")
//                 }
//                 onClick={() => onToggle(c.key)}
//               >
//                 <span
//                   className="graph-legend__swatch"
//                   style={{ background: c.fill }}
//                 />
//                 <span>{c.label}</span>
//               </button>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }


import React from "react";

export default function Legend({ categories, activeKeys, onToggle }) {
  const keys = Array.isArray(activeKeys) ? activeKeys : [];
  const [isMinimized, setIsMinimized] = React.useState(false);

  const legendRef = React.useRef(null);
  const draggingRef = React.useRef(false);
  const offsetRef = React.useRef({ x: 0, y: 0 });

  // start further down the page
  const [pos, setPos] = React.useState({ x: 24, y: 120 });

  // track whether a ReactModalPortal exists
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    const checkModal = () => {
      const modalExists = !!document.querySelector(".ReactModal__Overlay--after-open");
      setIsModalOpen(modalExists);
    };

    checkModal();

    const observer = new MutationObserver(() => {
      checkModal();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const onPointerDownHeader = (e) => {
    if (e.button != null && e.button !== 0) return;

    const el = legendRef.current;
    if (!el) return;

    draggingRef.current = true;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    const rect = el.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;

    const el = legendRef.current;
    if (!el) return;

    const margin = 8;
    const w = el.offsetWidth;
    const h = el.offsetHeight;

    let nextX = e.clientX - offsetRef.current.x;
    let nextY = e.clientY - offsetRef.current.y;

    const maxX = window.innerWidth - w - margin;
    const maxY = window.innerHeight - h - margin;

    nextX = Math.max(margin, Math.min(nextX, maxX));
    nextY = Math.max(margin, Math.min(nextY, maxY));

    setPos({ x: nextX, y: nextY });
  };

  const onPointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // hide legend entirely when modal is open
  if (isModalOpen) return null;

  return (
    <div
      ref={legendRef}
      className={"graph-legend" + (isMinimized ? " is-minimized" : "")}
      style={{
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 9999,
      }}
    >
      <div
        className="graph-legend__header"
        onPointerDown={onPointerDownHeader}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: "grab", userSelect: "none", touchAction: "none" }}
      >
        <div className="graph-legend__title">Legend</div>

        <button
          type="button"
          className="graph-legend__min-btn"
          aria-expanded={!isMinimized}
          aria-label={isMinimized ? "Expand legend" : "Minimize legend"}
          onClick={() => setIsMinimized((v) => !v)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isMinimized ? "▴" : "▾"}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="graph-legend__clear">
            <button
              type="button"
              className="graph-legend__clear-btn"
              disabled={keys.length === 0}
              onClick={() => onToggle(null)}
            >
              Clear
            </button>
          </div>

          <div className="graph-legend__list">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                className={
                  "graph-legend__item" + (keys.includes(c.key) ? " is-active" : "")
                }
                onClick={() => onToggle(c.key)}
              >
                <span
                  className="graph-legend__swatch"
                  style={{ background: c.fill }}
                />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
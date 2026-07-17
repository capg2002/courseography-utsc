import React from "react";

export default function ProgramRequirementsPopover({
  show,
  onClose,
  rows,
}) {

    const [pos, setPos] = React.useState({ x: 12, y: 12 });
    const dragRef = React.useRef(null);

    const startDrag = (clientX, clientY) => {
        const start = { x: clientX, y: clientY };
        const startPos = { ...pos };

        const onMove = (e) => {
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = x - start.x;
            const dy = y - start.y;

            // keep it on-screen a bit
            const nextX = Math.max(0, startPos.x + dx);
            const nextY = Math.max(0, startPos.y + dy);

            setPos({ x: nextX, y: nextY });
        };

        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onUp);
    };

    const onMouseDown = (e) => {
        // only start drag from the handle
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
    };

    const onTouchStart = (e) => {
        // prevent scroll while dragging from handle
        e.preventDefault();
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY);
    };

  if (!show) return null;

    return (
        <div
            className="req-popover"
            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            role="dialog"
            aria-label="Program requirements"
        >
            <div
                className="req-popover__drag"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                ref={dragRef}
            >
                <strong>Program Requirements</strong>
                <button type="button" onClick={onClose}>✕</button>
            </div>

            <div className="req-popover__list">
                {rows.map(r => (
                    <div key={r.id} className={`req-popover__row ${r.completed ? "is-complete" : ""}`}>
                        <span className="req-popover__check">{r.completed ? "✓" : ""}</span>
                        <div className="req-popover__text">
                            <div className="req-popover__label">{r.label}</div>
                            <div className="req-popover__progress">{r.haveCount}/{r.needCount}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
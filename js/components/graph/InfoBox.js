import PropTypes from "prop-types"

export default function InfoBox({
  showInfoBox,
  nodeId,
  courseCache,
  xPos,
  yPos,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  // guard against rendering with no course
  if (!nodeId) {
    return null
  }
  const course = courseCache?.[nodeId.toLowerCase()];
  const title = course
    ? `${course.title}`
    : "Loading…";

  const displayTitle =
    title.length > 60 ? title.slice(0, 31) + "…" : title;
  const className = showInfoBox ? "tooltip-group-display" : "tooltip-group-hidden"

  const rectAttrs = {
    id: nodeId + "-tooltip" + "-rect",
    x: xPos,
    y: yPos + 2,
    rx: "4",
    ry: "4",
    fill: "white",
    fillOpacity: "0.85",
    stroke: "black",
    strokeWidth: "2",
    width: "280",
    height: "30",
  }

  const textAttrs = {
    id: nodeId + "-tooltip" + "-text",
    fontSize: "10px",
    x: xPos + 60 / 2 - 18,
    y: yPos + 2,
  }

//   return (
//     <g
//       id="infoBox"
//       className={className}
//       onClick={onClick}
//       onMouseEnter={onMouseEnter}
//       onMouseLeave={onMouseLeave}
//     >
//       <rect {...rectAttrs} />
//       <text {...textAttrs}>{displayTitle}</text>
//     </g>
//   )
// }
  return (
    <g
      id="infoBox"
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <rect {...rectAttrs} />
      <foreignObject
        x={xPos}
        y={yPos + 2}
        width= {280}
        height={30}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",     // vertical center
            justifyContent: "center", // horizontal center
            padding: `${8}px`,
            boxSizing: "border-box",
            textAlign: "center",
            fontSize: "12px",
            fontFamily: "sans-serif",
            lineHeight: "1.2",
            overflow: "hidden",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            backgroundColor: "var(--bg)",
            opacity: 0.4
          }}
        >
          {displayTitle}
        </div>
      </foreignObject>
    </g>
  )
// InfoBox.propTypes = {
//   showInfoBox: PropTypes.bool,
//   nodeId: PropTypes.string,
//   xPos: PropTypes.number,
//   yPos: PropTypes.number,
//   onClick: PropTypes.func,
//   onMouseEnter: PropTypes.func,
//   onMouseLeave: PropTypes.func,
//   nodesJSON: PropTypes.object,
// }
}

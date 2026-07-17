import { createRef, useCallback, useState } from "react"
import { MapModal } from "../common/react_modal.js.jsx"

/*
 * Holds the containers of the Fall and Spring timetables,
 * and performs some pre-processing steps with a list of 'Lecture' objects
 */

const DEFAULT_TIMETABLE_TAB = "summer" // Change to "summer" if you want Summer as default

const SUMMER_API_SESSION = "20265"

function getSessionLabel(apiSession, session) {
  if (apiSession === SUMMER_API_SESSION) {
    if (session === "F") return "Summer F"
    if (session === "S") return "Summer S"
    if (session === "Y") return "Summer Y"
  }

  if (session === "F") return "Fall"
  if (session === "S") return "Winter"
  if (session === "Y") return "Full Year"

  return session
}

function getCourseCellLabel(lecture) {
  return `${lecture.courseCode}\n${getSessionLabel(lecture.apiSession, lecture.session)}`
}

const TIMETABLE_TABS = {
  fallWinter: "fallWinter",
  summer: "summer",
}

const FALL_WINTER_TIMETABLES = [
  {
    key: "fall",
    label: "F Term",
    side: "left",
    includeLecture: lecture =>
      lecture.apiSession !== SUMMER_API_SESSION &&
      (lecture.session === "F" || lecture.session === "Y"),
  },
  {
    key: "winter",
    label: "S Term",
    side: "right",
    includeLecture: lecture =>
      lecture.apiSession !== SUMMER_API_SESSION &&
      (lecture.session === "S" || lecture.session === "Y"),
  },
]

const SUMMER_TIMETABLES = [
  {
    key: "summerF",
    label: "Summer F Term",
    side: "left",
    includeLecture: lecture =>
      lecture.apiSession === SUMMER_API_SESSION &&
      (lecture.session === "F" || lecture.session === "Y"),
  },
  {
    key: "summerS",
    label: "Summer S Term",
    side: "right",
    includeLecture: lecture =>
      lecture.apiSession === SUMMER_API_SESSION &&
      (lecture.session === "S" || lecture.session === "Y"),
  },
]

export function Row(props) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TIMETABLE_TAB)

  // Create a list of lecture objects
  let lectures = props.lectureSections.map((lectureSection, index, lectureSections) =>
    createNewLectures(lectureSection, index, lectureSections)
  )
  lectures = [].concat.apply([], lectures)

  const timetableConfigs =
    activeTab === TIMETABLE_TABS.summer ? SUMMER_TIMETABLES : FALL_WINTER_TIMETABLES

  return (
    <div>
      <div className="timetable-tabs timetable-tabs-right">
        <button
          type="button"
          className={
            activeTab === TIMETABLE_TABS.fallWinter
              ? "timetable-tab active-timetable-tab"
              : "timetable-tab"
          }
          onClick={() => setActiveTab(TIMETABLE_TABS.fallWinter)}
        >
          Fall/Winter
        </button>

        <button
          type="button"
          className={
            activeTab === TIMETABLE_TABS.summer
              ? "timetable-tab active-timetable-tab"
              : "timetable-tab"
          }
          onClick={() => setActiveTab(TIMETABLE_TABS.summer)}
        >
          Summer
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "flex-start",
          gap: "0",
        }}
      >
        {timetableConfigs.map(config => {
          const sessionLectures = lectures.filter(config.includeLecture)
          const lecturesByTime = initializeSession(sessionLectures)

          setWidths(lecturesByTime)

          const colSpans = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
          storeColSpans(lecturesByTime, colSpans)

          return (
            <TimetableContainer
              key={config.key}
              session={config.key}
              sessionLabel={config.label}
              side={config.side}
              lecturesByTime={lecturesByTime}
              headColSpans={colSpans}
              lectures={sessionLectures}
            />
          )
        })}
      </div>
    </div>
  )
}

/*
 * The container specifies formatting for all of the elements wrapped inside,
 * (for example, every element inside a container will follow the same margin rules)
 */
function TimetableContainer(props) {
  return (
    <div className="timetable-container">
      <Timetable
        session={props.session}
        sessionLabel={props.sessionLabel}
        side={props.side}
        lecturesByTime={props.lecturesByTime}
        headColSpans={props.headColSpans}
        lectures={props.lectures}
      />
    </div>
  )
}

/*
 * A <table> element for the specified session
 */
function Timetable(props) {
  const openMapModal = useCallback(modal => {
    modal.current.openModal()
  }, [])

  const modal = createRef()
  const displayMap = session => openMapModal(modal)

  return (
    <table className={"timetable table"} id={"timetable-" + props.session}>
      <MapModal ref={modal} lectures={props.lectures} />
      <TimetableHeader
        session={props.session}
        sessionLabel={props.sessionLabel}
        side={props.side}
        lecturesByTime={props.lecturesByTime}
        headColSpans={props.headColSpans}
        openMap={displayMap}
      />
      <TimetableBody
        session={props.session}
        side={props.side}
        lecturesByTime={props.lecturesByTime}
        headColSpans={props.headColSpans}
      />
    </table>
  )
}

/*
 * Describes what the header of a table should look like, based on the session.
 * The header contains five day cells, a dummy cell, and a term-name cell
 */
function TimetableHeader(props) {
  const dayStrings = ["Mon", "Tue", "Wed", "Thu", "Fri"]
  const colSpans = props.headColSpans

  const dayCells = []
  for (let i = 0; i < 5; i++) {
    const dayString = dayStrings[i]
    dayCells.push(
      <th scope="col" colSpan={colSpans[i]} key={"day-header-" + i}>
        {dayString}
      </th>
    )
  }

  if (props.side === "left") {
    return (
      <thead>
        <tr>
          <th className="timetable-dummy-cell"></th>
          <th className="term-name">{props.sessionLabel}</th>
          {dayCells}
        </tr>
      </thead>
    )
  }

  return (
    <thead>
      <tr>
        {dayCells}
        <th className="term-name">{props.sessionLabel}</th>
        <th className="timetable-dummy-cell"></th>
      </tr>
    </thead>
  )
}

/*
 * Describes the body of the Timetable
 */
function TimetableBody(props) {
  const rows = []
  // For each row from 8 o'clock to 22 o'clock, there is an 'Hour' and 'Half hour' row
  for (let i = 8; i < 22; i += 0.5) {
    rows.push(
      <TimetableRow
        session={props.session}
        side={props.side}
        time={i}
        key={"timetable-row-" + i + props.session}
        currentLectures={props.lecturesByTime[i]}
        headColSpans={props.headColSpans}
      />
    )
  }

  return <tbody>{rows}</tbody>
}

/*
 * Describes what a row in the Timetable should look like,
 * based off of the session, time, and previous cells generated.
 */
function TimetableRow(props) {
  const tableData = []
  const dummyCell = (
    <td key="timetable-dummy-cell" className="timetable-dummy-cell"></td>
  )
  const currTime = props.time
  const currSess = props.session

  // The dictionary of lectures for this hour
  const currentLectures = props.currentLectures
  const headColSpans = props.headColSpans

  for (let day = 0; day < 5; day++) {
    // Variables for calculations
    const headerColSpan = headColSpans[day]
    let totalColSpans = 0

    // Get the list of lectures at this time-day slot
    const currentLectureList = currentLectures[day]

    if (currentLectureList.length !== 0) {
      currentLectureList.forEach(lecture => {
        const lecColSpan = headerColSpan / lecture.width

        if (lecture.startTime === currTime) {
          const rowSpan = 2 * (lecture.endTime - lecture.startTime)
          tableData.push(
            <td
              id={"" + day.toString() + currTime + "-0" + totalColSpans + currSess}
              key={"" + day.toString() + currTime + "-0" + totalColSpans + currSess}
              data-in-conflict={lecture.inConflict}
              data-satisfied={lecture.dataSatisfied}
              rowSpan={rowSpan}
              colSpan={lecColSpan}
              className="timetable-cell timetable-edge"
              type="L"
              clicked="true"
              data-currentlecturelist={currentLectureList}
            >
              {lecture.courseCode}
            </td>
          )
        }

        totalColSpans += lecColSpan
      })
    }

    for (let i = totalColSpans; i < headerColSpan; i++) {
      tableData.push(
        <td
          id={"" + day.toString() + currTime + "-0" + i + currSess}
          key={"" + day.toString() + currTime + "-0" + i + currSess}
          data-in-conflict="false"
          data-satisfied="true"
          rowSpan="1"
          className={
            currTime % 1 === 0 ? "timetable-cell-tophalf" : "timetable-cell-bottomhalf"
          }
        ></td>
      )
    }
  }

  if (currTime % 1 === 0) {
    const adjustedTime = (currTime === 12 ? 12 : currTime % 12) + ":00"
    const timeCell = (
      <td key="timetable-time" className="timetable-time" rowSpan="2">
        {adjustedTime}
      </td>
    )

    if (props.side === "left") {
      tableData.unshift(timeCell)
      tableData.unshift(dummyCell)
    } else {
      tableData.push(timeCell)
      tableData.push(dummyCell)
    }
  } else {
    if (props.side === "left") {
      tableData.unshift(dummyCell)
    } else {
      tableData.push(dummyCell)
    }
  }

  return <tr>{tableData}</tr>
}
/**
 * Helper function to initialize the <fallSession> and <springSession> 2-D dictionaries
 * @param {list} lectures : List of 'Lecture' objects
 */
function initializeSession(lectures) {
  const session = {}

  for (let i = 7; i < 22; i += 0.5) {
    session[i] = { 0: [], 1: [], 2: [], 3: [], 4: [] }
  }

  lectures.forEach(lecture => {
    for (let i = lecture.startTime; i < lecture.endTime; i += 0.5) {
      session[i][lecture.day].push(lecture)
    }
  })

  return session
}

/**
 * Helper function which sets the width of each Lecture,
 * and also sets the inConflict attribute of all Lecture objects
 * @param {dictionary} session : 2-D Dictionary storing lectures active in the session
 */
function setWidths(session) {
  for (let i = 8; i < 22; i += 0.5) {
    const timeRow = session[i]
    // Reset all widths back to 1 and inConflict to false if this time slot is the startTime of
    // the lecture
    for (let day = 0; day < 5; day++) {
      const timeDaySlot = timeRow[day]
      timeDaySlot.forEach(lecture => {
        // Do not set the width back to 1 if there is already a conflict (this situation applies to
        // 'Y' session lectures)
        if (lecture.startTime === i && lecture.width === 1) {
          lecture.width = 1
          lecture.inConflict = false
        }
        // If in this time-and-day slot there is a lecture conflict
        if (lectureConflict(timeDaySlot)) {
          // Readjust (if needed) the 'width's of the lectures at this slot
          if (lecture.width < timeDaySlot.length) {
            lecture.width = timeDaySlot.length
          }
          // Also specify that this lecture is in conflict
          lecture.inConflict = true
        }
      })
    }
  }
}

/**
 * Helper function which stores the 'colSpan' attribute value for each day in the table header
 * @param {dictionary} colSpans : Dictionary storing the 'colSpan' attribute value for each day
 */
function storeColSpans(session, colSpans) {
  // For each day, stores all possible 'width' values every lecture at that day could have
  const widths = storeWidths(session)
  for (let day = 0; day < 5; day++) {
    // The 'colSpan' attribute of a header day cell is defined as the product of all
    // possible widths that could occur at that day
    colSpans[day] = widths[day].reduce((a, b) => a * b, 1)
  }
}

/**
 * Helper function which, for each day, stores all possible 'width' values the lectures in that day could have
 * @param {dictionary} session : 2-D Dictionary storing lectures active in the session
 */
function storeWidths(session) {
  const widths = {}
  // Iterate through every time-day slot in the session
  for (let day = 0; day < 5; day++) {
    widths[day] = []
    for (let i = 8; i < 22; i += 0.5) {
      const timeRow = session[i]
      const timeDaySlot = timeRow[day]
      // If there are lectures running at this time-day slot
      if (timeDaySlot.length > 0) {
        // Retrieve a lecture width at this time-day slot
        const width = timeDaySlot[0].width
        // Store the width of this lecture, if it hasn't already been stored
        if (widths[day].indexOf(width) < 0) {
          widths[day].push(width)
        }
      }
    }
  }
  return widths
}

/**
 * Helper function which returns if there is a course conflict at a time-and-day slot
 * (denoted by the number of courses in the list at this time-and-day slot)
 */
function lectureConflict(courseList) {
  return courseList.length > 1
}

/**
 * Create a list of lecture objects representing each separate time a given lecture section takes place
 * @param {Object} lectureSection : Represents a lecture section for a course with time periods in which the lecture
 *                            takes place
 * @return {array} An array of objects representing each disconnected time period the given
 *                  lecture occurs in
 */
function createNewLectures(lectureSection, index, lectureSections) {
  // dataSatisfied is false if a tutorial or practical for a course is selected in a particular session(F or S) and there
  // is no lecture selected for that course in the given session.
  lectureSection.dataSatisfied = false
  const lectureSelected = lectureSections.filter(lecture => {
    return (
      lecture.lectureCode.substring(0, 1) === "L" &&
      lecture.courseCode.substring(0, 6) === lectureSection.courseCode.substring(0, 6) &&
      lecture.session === lectureSection.session &&
      lecture.apiSession === lectureSection.apiSession
    )
  })
  if (lectureSelected.length > 0) {
    lectureSection.dataSatisfied = true
  }

  const dayStrings = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const lectures = lectureSection.times.map(time => {
    return {
      courseCode: lectureSection.courseCode,
      apiSession: lectureSection.apiSession,
      session: lectureSection.session,
      day: time.weekDay,
      dayString: dayStrings[time.weekDay],
      startTime: time.startHour,
      endTime: time.endHour,
      fstRoom: time.firstRoom,
      secRoom: time.secondRoom,
      inConflict: false,
      width: 1,
      dataSatisfied: lectureSection.dataSatisfied,
    }
  })
  return lectures
}

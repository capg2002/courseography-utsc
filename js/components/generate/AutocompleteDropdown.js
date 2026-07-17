// import React, { useEffect, useState } from "react"
// import Autocomplete from "@mui/material/Autocomplete"
// import { useField } from "formik"
// import PropTypes from "prop-types"

// export default function AutocompleteDropdown({
//   name,
//   placeholder,
//   id,
//   onSelectedChange,
//   ...props
// }) {
//   const [field, , helpers] = useField(name)
//   const { setValue } = helpers
//   const [optionList, setOptionList] = useState([])

//   // Single selected value (string or null)
//   const selected =
//     typeof field.value === "string" && field.value.trim().length
//       ? field.value.trim()
//       : null

//   useEffect(() => {
//     let cancelled = false

//     const load = async () => {
//       try {
//         // Only programs now
//         const resp = await fetch("/program-codes", { cache: "no-store" })
//         const text = await resp.text()

//         const programs = text
//           .split("\n")
//           .map(s => s.trim())
//           .filter(Boolean)

//         if (!cancelled) setOptionList(programs)
//       } catch (e) {
//         console.error("AutocompleteDropdown fetch failed:", e)
//         if (!cancelled) setOptionList([])
//       }
//     }

//     load()
//     return () => {
//       cancelled = true
//     }
//   }, [])

//   return (
//     <Autocomplete
//       value={selected}
//       onChange={(event, newValue) => {
//         onSelectedChange?.(newValue)
//         setValue(newValue ?? "")
//       }}
//       options={optionList}
//       isOptionEqualToValue={(o, v) => o === v}
//       includeInputInList
//       disableClearable={false}   // allow clearing (optional)
//       disableCloseOnSelect={false}
//       popupIcon={null}
//       sx={{ width: "100%" }}
//       renderInput={params => (
//         <div ref={params.InputProps.ref}>
//           <input
//             aria-label={name}
//             type="text"
//             {...params.inputProps}
//             placeholder={placeholder}
//             id={id}
//           />
//         </div>
//       )}
//       renderOption={(liProps, option) => {
//         const { key, style, ...rest } = liProps
//         return (
//           <li
//             key={key}
//             {...rest}
//             style={{
//               ...style,
//               fontFamily: '"Trebuchet MS", Arial, sans-serif',
//               color: "#5c497e",
//             }}
//           >
//             {option}
//           </li>
//         )
//       }}
//       {...props}
//     />
//   )
// }

// AutocompleteDropdown.propTypes = {
//   name: PropTypes.string,
//   placeholder: PropTypes.string,
//   id: PropTypes.string,
//   onSelectedChange: PropTypes.func,
// }

import React, { useEffect, useMemo, useState } from "react"
import Autocomplete from "@mui/material/Autocomplete"
import { useField } from "formik"
import PropTypes from "prop-types"

const CATEGORY_LABEL = {
  major: "Major",
  minor: "Minor",
  specialist: "Specialist",
}

export default function AutocompleteDropdown({
  name,
  placeholder,
  id,
  onSelectedChange,
  ...props
}) {
  const [field, , helpers] = useField(name)
  const { setValue } = helpers

  // options: [{ program, program_desc, category }]
  const [optionList, setOptionList] = useState([])

  // Formik stores string code; Autocomplete expects an option object
  const selectedCode =
    typeof field.value === "string" && field.value.trim().length
      ? field.value.trim()
      : ""

  const selectedOption = useMemo(() => {
    if (!selectedCode) return null
    return optionList.find(o => o.program === selectedCode) ?? null
  }, [selectedCode, optionList])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        // ✅ point this to wherever you put the JSON index
        // e.g. /program-index.json or still /program-codes if you change it to return JSON
        const resp = await fetch("/static/js/generate/program-index.json", { cache: "no-store" })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const programs = await resp.json()

        // Defensive cleanup + stable sort (category -> program code)
        const cleaned = (programs || [])
          .filter(p => p && p.program && p.program_desc && p.category)
          .map(p => ({
            program: String(p.program).trim(),
            program_desc: String(p.program_desc).trim(),
            category: String(p.category).trim().toLowerCase(),
          }))

        cleaned.sort((a, b) => {
          const ca = CATEGORY_LABEL[a.category] ?? a.category
          const cb = CATEGORY_LABEL[b.category] ?? b.category
          if (ca !== cb) return ca.localeCompare(cb)
          return a.program.localeCompare(b.program)
        })

        if (!cancelled) setOptionList(cleaned)
      } catch (e) {
        console.error("AutocompleteDropdown fetch failed:", e)
        if (!cancelled) setOptionList([])
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Autocomplete
      value={selectedOption}
      options={optionList}
      // group into sections
      groupBy={opt => CATEGORY_LABEL[opt.category] ?? opt.category}
      renderGroup={params => (
        <li key={params.key}>
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "white",
              padding: "6px 10px",
              fontWeight: 800,
              fontSize: "24px",
              letterSpacing: "0.02em",
              fontFamily: '"Trebuchet MS", Arial, sans-serif',
              color: "#5c497e",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {params.group}
          </div>
          <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
        </li>
      )}
      // how the input and filtering “see” each option
      getOptionLabel={opt =>
        opt ? `${opt.program} — ${opt.program_desc}` : ""
      }
      isOptionEqualToValue={(o, v) => o.program === v.program}
      onChange={(event, newOpt) => {
        // keep your existing app behavior: Formik stores the CODE only
        const newCode = newOpt?.program ?? ""
        onSelectedChange?.(newCode, newOpt) // pass both if you want
        setValue(newCode)
      }}
      includeInputInList
      disableClearable={false}
      disableCloseOnSelect={false}
      popupIcon={null}
      sx={{ width: "100%" }}
      renderInput={params => (
        <div ref={params.InputProps.ref}>
          <input
            aria-label={name}
            type="text"
            {...params.inputProps}
            placeholder={placeholder}
            id={id}
          />
        </div>
      )}
      renderOption={(liProps, option) => {
        const { key, style, ...rest } = liProps
        return (
          <li
            key={key}
            {...rest}
            style={{
              ...style,
              fontFamily: '"Trebuchet MS", Arial, sans-serif',
              color: "#5c497e",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "14px",
            }}
          >
            <span style={{ fontWeight: 800 }}>{option.program}</span>
            <span style={{ opacity: 0.9 }}>{option.program_desc}</span>
          </li>
        )
      }}
      {...props}
    />
  )
}

AutocompleteDropdown.propTypes = {
  name: PropTypes.string,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  onSelectedChange: PropTypes.func,
}
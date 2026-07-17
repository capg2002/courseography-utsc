import { COURSE_META } from "./CourseMeta";      // course list
import { PROGRAM_RULES } from "./programCourseLists";

const COURSE_META_FLAT = Array.isArray(COURSE_META?.[0]) ? COURSE_META.flat() : COURSE_META;

const LEVEL_ORDER = ["A", "B", "C", "D"];

const courseLevelByCode = (() => {
  const m = new Map();
  for (const c of COURSE_META_FLAT) m.set(c.code, c.level);
  return m;
})();

function splitCodesByLevel(codes) {
  const buckets = { A: [], B: [], C: [], D: [], Unknown: [] };

  for (const code of codes) {
    const lvl = courseLevelByCode.get(code);
    if (lvl && buckets[lvl]) buckets[lvl].push(code);
    else buckets.Unknown.push(code);
  }
  return buckets;
}
// returns a *multiline* label
function mustLabelByLevel(codes) {
  const b = groupByLevel(codes);

  const lines = [];
  for (const L of LEVEL_ORDER) {
    if (b[L].length) lines.push(`${L}-level: ${b[L].join(", ")}`);
  }
  if (b.Unknown.length) lines.push(`Other: ${b.Unknown.join(", ")}`);

  return `All of:\n${lines.join("\n")}`;
}

function matchesAccepts(accepts, course) {
  if (!accepts) return false;

  // anyOf: OR of sub-accepts
  if (accepts.anyOf) return accepts.anyOf.some(a => matchesAccepts(a, course));

  // codeIn
  if (accepts.codeIn && !accepts.codeIn.includes(course.code)) return false;

  // dept prefix handling (your meta stores dept like "STA", "CSC", "MAT")
  if (accepts.deptPrefix) {
    const prefixes = Array.isArray(accepts.deptPrefix) ? accepts.deptPrefix : [accepts.deptPrefix];
    if (!prefixes.includes(course.dept)) return false;
  }
  if (accepts.deptPrefixIn && !accepts.deptPrefixIn.includes(course.dept)) return false;

  // levels
  if (accepts.levelIn && !accepts.levelIn.includes(course.level)) return false;

  // not clause
  if (accepts.not) {
    const n = accepts.not;
    if (n.codeIn && n.codeIn.includes(course.code)) return false;

  
    if (n.deptPrefix) {
      const prefixes = Array.isArray(n.deptPrefix) ? n.deptPrefix : [n.deptPrefix];
      if (prefixes.some(pfx => course.code.startsWith(pfx))) return false;
    }
  }

  return true;
}

function describeAccepts(accepts) {
  if (!accepts) return "";

  // anyOf → "either A or B"
  if (accepts.anyOf) {
    return accepts.anyOf
      .map(describeAccepts)
      .filter(Boolean)
      .join(" OR ");
  }

  const parts = [];

  // Department(s)
  const depts =
    accepts.deptPrefixIn ??
    (accepts.deptPrefix
      ? Array.isArray(accepts.deptPrefix)
        ? accepts.deptPrefix
        : [accepts.deptPrefix]
      : null);

  if (depts?.length) {
    parts.push(depts.join("/"));
  }

  // Level(s)
  if (accepts.levelIn?.length) {
    if (accepts.levelIn.length === 1) {
      parts.push(`${accepts.levelIn[0]}-level`);
    } else {
      parts.push(`${accepts.levelIn.join(" or ")}-level`);
    }
  }

  // Explicit code list
  if (accepts.codeIn?.length) {
    parts.push(accepts.codeIn.join(", "));
  }

  let base = parts.length ? parts.join(" ") : "";

  // NOT clause
  if (accepts.not) {
    const exclusions = [];

    if (accepts.not.codeIn?.length) {
      exclusions.push(accepts.not.codeIn.join(", "));
    }

    if (accepts.not.deptPrefix?.length) {
      exclusions.push(
        accepts.not.deptPrefix.map(p => `${p}*`).join(", ")
      );
    }

    if (exclusions.length) {
      base += ` except ${exclusions.join(" and ")}`;
    }
  }

  return base.trim();
}

function eligibleCoursesFromAccepts(accepts) {
  return COURSE_META_FLAT
    .filter(c => matchesAccepts(accepts, c))
    .map(c => c.code);
}
// Expand a rule into the eligible course list it refers to (for choose/pool display & counting)
function eligibleCoursesForRule(rule) {
  if (rule.courses) return rule.courses;

  if (rule.accepts) {
    return eligibleCoursesFromAccepts(rule.accepts);
  }

  return [];
}

function poolLabel(rule) {
  if (rule.label) return rule.label;

  // Explicit course list
  if (rule.courses) {
    return `${rule.k} of ${rule.courses.join(", ")}`;
  }

  if (rule.accepts) {
    const desc = describeAccepts(rule.accepts);
    return `${rule.k} of ${desc}`;
  }

  return `${rule.k} courses`;
}

// Turn rules into UI-friendly requirement rows with completion status
export function requirementsProgress(programId, selectedSetUpper) {
  const rules = PROGRAM_RULES[programId] ?? [];
  const rows = [];

  // remaining = courses not yet used by earlier requirements
  const remaining = new Set(selectedSetUpper);

  // Helpers
  const allocFromRemaining = (eligibleList, k) => {
    const picked = [];
    for (const c of eligibleList) {
      if (picked.length >= k) break;
      if (remaining.has(c)) {
        picked.push(c);
        remaining.delete(c); // spend it
      }
    }
    return picked;
  };

  const countInSelected = (list) => list.filter(c => selectedSetUpper.has(c)).length;

  // MUST: fixed courses, these should "reserve" their own courses if selected

  for (const rule of rules.filter(r => r.type === "must" || r.type === "exact")) {
    const need = rule.courses ?? [];

    // Split into A/B/C/D buckets
    const buckets = splitCodesByLevel(need);

    // Create one requirement row per level (and optionally Unknown)
    const makeLevelRow = (levelKey, codes) => {
        if (!codes.length) return;

        // allocate: spend any selected courses in this bucket here so they can’t be reused later
        const picked = [];
        for (const c of codes) {
            if (remaining.has(c)) {
                picked.push(c);
                remaining.delete(c);
            }
        }

        rows.push({
            id: `must_${programId}_${levelKey}_${codes.join("_")}`,
            kind: "must",
            level: levelKey, // "A" | "B" | "C" | "D" | "Unknown"
            label: `${levelKey}-level must: ${codes.join(", ")}`,
            needCount: codes.length,
            haveCount: picked.length, 
            completed: picked.length === codes.length,
            eligible: codes,
            picked,
            missing: codes.filter(c => !selectedSetUpper.has(c)),
        });
    };

    for (const L of LEVEL_ORDER) makeLevelRow(L, buckets[L]);
    if (buckets.Unknown.length) makeLevelRow("Unknown", buckets.Unknown);
}

  // CHOOSE: allocate up to k from remaining
  for (const rule of rules.filter(r => r.type === "choose")) {
    const eligible = rule.courses ?? [];
    const k = rule.k ?? 1;

    const picked = allocFromRemaining(eligible, k);

    rows.push({
      id: `choose_${k}_${eligible.join("_")}`,
      kind: "choose",
      label: `${k} of ${eligible.join(", ")}`,
      needCount: k,
      haveCount: picked.length,
      completed: picked.length >= k,
      eligible,
      picked,
    });
  }

  // POOLS: sort by priority and allocate in that order
  const poolRules = rules
    .filter(r => r.type === "pool")
    .slice()
    .sort((a, b) => (a.priority ?? 9999) - (b.priority ?? 9999));

  for (const rule of poolRules) {
    const eligible = eligibleCoursesForRule(rule);
    const k = rule.k ?? 1;

    // deterministic allocation order:
    const picked = allocFromRemaining(eligible, k);

    rows.push({
      id: rule.id ?? `pool_${k}_${eligible.join("_")}`,
      kind: "pool",
      label: poolLabel(rule),
      needCount: k,
      haveCount: picked.length,
      completed: picked.length >= k,
      eligible,
      picked,
      priority: rule.priority ?? null,
    });
  }

  return rows;
}
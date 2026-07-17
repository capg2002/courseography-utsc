import { COURSE_META as COURSE_META_NESTED } from "./CourseMeta";
import { PROGRAM_RULES } from "./programCourseLists";

// Flatten COURSE_META safely (handles accidental extra nesting)
const COURSE_META = Array.isArray(COURSE_META_NESTED)
  ? COURSE_META_NESTED.flat(Infinity).filter(Boolean)
  : [];

// matches accepts objects like: codeIn, deptPrefix, deptPrefixIn, levelIn, not, anyOf
function matchesAccepts(accepts, course) {
  if (!accepts) return false;

  // OR
  if (Array.isArray(accepts.anyOf)) {
    return accepts.anyOf.some((a) => matchesAccepts(a, course));
  }

  // direct inclusions
  if (Array.isArray(accepts.codeIn) && !accepts.codeIn.includes(course.code)) return false;

  // dept constraints
  if (accepts.deptPrefix) {
    const prefixes = Array.isArray(accepts.deptPrefix) ? accepts.deptPrefix : [accepts.deptPrefix];
    if (!prefixes.includes(course.dept)) return false;
  }
  if (Array.isArray(accepts.deptPrefixIn) && !accepts.deptPrefixIn.includes(course.dept)) return false;

  // level constraints
  if (Array.isArray(accepts.levelIn) && !accepts.levelIn.includes(course.level)) return false;

  // negations
  if (accepts.not) {
    const n = accepts.not;

    if (Array.isArray(n.codeIn) && n.codeIn.includes(course.code)) return false;

    if (n.deptPrefix) {
      const prefixes = Array.isArray(n.deptPrefix) ? n.deptPrefix : [n.deptPrefix];
      if (prefixes.includes(course.dept)) return false;
    }

    if (Array.isArray(n.deptPrefixIn) && n.deptPrefixIn.includes(course.dept)) return false;

    if (Array.isArray(n.levelIn) && n.levelIn.includes(course.level)) return false;
  }

  return true;
}

export function allowedCoursesForProgram(programId) {
  const rules = PROGRAM_RULES?.[programId] ?? [];
  const allowed = new Set();
  const excluded = new Set();

  const addMany = (arr) => (arr ?? []).forEach((c) => allowed.add(c));

  for (const rule of rules) {
    switch (rule.type) {
      case "must":
      case "exact":
        addMany(rule.courses);
        break;

      case "choose":
        // For visibility: all options are credit-eligible
        addMany(rule.courses);
        break;

      case "level": {
        const levels = rule.levels ?? (rule.level ? [rule.level] : []);
        COURSE_META
          .filter((c) => c.dept === rule.dept && levels.includes(c.level))
          .forEach((c) => allowed.add(c.code));
        break;
      }

      case "pool": {
        // If pool is given as an explicit course list, include them all
        if (Array.isArray(rule.courses)) {
          addMany(rule.courses);
        } else if (rule.accepts) {
          // Otherwise expand from COURSE_META by accepts rules
          COURSE_META
            .filter((c) => matchesAccepts(rule.accepts, c))
            .forEach((c) => allowed.add(c.code));
        }
        break;
      }

      case "exclude":
        (rule.courses ?? []).forEach((c) => excluded.add(c));
        break;

      default:
        break;
    }
  }

  // Apply exclusions last
  for (const c of excluded) allowed.delete(c);

  return [...allowed];
}
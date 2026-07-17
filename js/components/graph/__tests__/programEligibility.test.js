import { allowedCoursesForProgram } from "./programEligibility";

test("Math Major includes required courses", () => {
  const allowed = new Set(allowedCoursesForProgram("SCMAJ1165"));
  expect(allowed.has("MATA22H3")).toBe(true);
  expect(allowed.has("MATB24H3")).toBe(true);
});

test("SCMAJ2289 excludes STAC32H3 from pool rule", () => {
  const allowed = new Set(allowedCoursesForProgram("SCMAJ2289"));
  expect(allowed.has("STAC32H3")).toBe(false);
});
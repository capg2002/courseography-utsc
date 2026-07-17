export function showOnlyCourses(allowedCourses) {
  const allowed = new Set(allowedCourses);

  document.querySelectorAll("g.node[data-course]").forEach(n => {
    const code = n.getAttribute("data-course");
    n.classList.toggle("hidden", !allowed.has(code));
  });

  document.querySelectorAll("g.edge[data-from][data-to]").forEach(e => {
    const from = e.getAttribute("data-from");
    const to = e.getAttribute("data-to");
    e.classList.toggle("hidden", !allowed.has(from) || !allowed.has(to));
  });
}

export function clearCourseFilter() {
  document.querySelectorAll(".hidden").forEach(el => el.classList.remove("hidden"));
}
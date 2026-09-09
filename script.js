/* =========================================================
   EduTrack Analytics — script.js
   Vanilla JS. No dependencies. No build step.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. Seeded random (so sample data is stable across reloads)
     --------------------------------------------------------- */
  function makeSeededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  const rand = makeSeededRandom(20260909);
  const randRange = (min, max) => min + rand() * (max - min);
  const randInt = (min, max) => Math.floor(randRange(min, max + 1));
  const pick = (arr) => arr[randInt(0, arr.length - 1)];

  /* ---------------------------------------------------------
     2. Sample data generation
     --------------------------------------------------------- */
  const FIRST_NAMES = [
    "Andrea",
    "Miguel",
    "Kristine",
    "Josiah",
    "Bea",
    "Nathaniel",
    "Angela",
    "Carlo",
    "Denise",
    "Enzo",
    "Faith",
    "Gabriel",
    "Hannah",
    "Ivan",
    "Julia",
    "Kevin",
    "Liza",
    "Marco",
    "Nicole",
    "Oliver",
  ];
  const LAST_NAMES = [
    "Santos",
    "Reyes",
    "Cruz",
    "Bautista",
    "Del Rosario",
    "Garcia",
    "Torres",
    "Mendoza",
    "Ramos",
    "Aquino",
    "Villanueva",
    "Castillo",
    "Navarro",
    "Fernandez",
    "Pascual",
    "Domingo",
    "Salazar",
    "Ocampo",
    "Rivera",
    "Gonzales",
  ];
  const PROGRAMS = ["BSIT", "BSCS", "BSPsych"];
  const PROGRAM_LABELS = {
    BSIT: "BS Information Technology",
    BSCS: "BS Computer Science",
    BSPsych: "BS Psychology",
  };
  const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const COURSE_BANK = {
    BSIT: [
      "Web Development",
      "Data Structures",
      "Database Systems",
      "Networking Fundamentals",
      "Systems Analysis",
    ],
    BSCS: [
      "Algorithms",
      "Computer Architecture",
      "Discrete Mathematics",
      "Operating Systems",
      "Software Engineering",
    ],
    BSPsych: [
      "General Psychology",
      "Abnormal Psychology",
      "Research Methods",
      "Developmental Psychology",
      "Statistics",
    ],
  };

  const GRADE_LETTERS = [
    "1.00",
    "1.25",
    "1.50",
    "1.75",
    "2.00",
    "2.25",
    "2.50",
    "2.75",
    "3.00",
  ];

  function gradeFromGpa(gpa) {
    // Lower is better on this school's scale reference, but we display GPA on 4.0 scale for the card;
    // for course-level grades we synthesize a plausible letter/point near the student's GPA band.
    const idx = Math.min(
      GRADE_LETTERS.length - 1,
      Math.max(0, Math.round((4 - gpa) * 2)),
    );
    return GRADE_LETTERS[idx];
  }

  function computeStatus(gpa, attendance) {
    if (gpa < 2.0 || attendance < 75) return "At Risk";
    if (gpa >= 3.5 && attendance >= 90) return "Excellent";
    if (gpa >= 3.0) return "Good";
    return "Average";
  }

  function riskReasons(gpa, attendance) {
    const reasons = [];
    if (gpa < 2.0) reasons.push("GPA below 2.00");
    if (attendance < 75) reasons.push("Attendance below 75%");
    return reasons;
  }

  function generateStudents(count) {
    const usedNames = new Set();
    const students = [];

    for (let i = 0; i < count; i++) {
      let name;
      do {
        name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      const program = pick(PROGRAMS);
      const yearLevel = pick(YEAR_LEVELS);

      // Skew distribution so most students are Good/Average, some Excellent, a few At Risk
      const band = rand();
      let gpa, attendance;
      if (band < 0.18) {
        gpa = +randRange(3.5, 4.0).toFixed(2);
        attendance = randInt(90, 100);
      } else if (band < 0.55) {
        gpa = +randRange(3.0, 3.49).toFixed(2);
        attendance = randInt(85, 97);
      } else if (band < 0.82) {
        gpa = +randRange(2.25, 2.99).toFixed(2);
        attendance = randInt(75, 90);
      } else {
        gpa = +randRange(1.2, 2.1).toFixed(2);
        attendance = randInt(55, 80);
      }

      const assignments = Math.max(
        40,
        Math.min(100, Math.round(attendance - randRange(-8, 12))),
      );
      const units = pick([18, 21, 24]);
      const status = computeStatus(gpa, attendance);

      const courseNames = COURSE_BANK[program];
      const courses = courseNames.slice(0, 4).map((c) => ({
        name: c,
        grade: gradeFromGpa(gpa + randRange(-0.4, 0.4)),
      }));

      students.push({
        id: `20${randInt(23, 26)}-${String(10000 + i * 37 + randInt(0, 36)).slice(-5)}`,
        name,
        program,
        yearLevel,
        gpa,
        attendance,
        assignments,
        units,
        status,
        courses,
      });
    }
    return students;
  }

  const STUDENTS = generateStudents(16);

  /* ---------------------------------------------------------
     3. Derived statistics
     --------------------------------------------------------- */
  function average(nums) {
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  function computeStats(students) {
    const avgGpa = average(students.map((s) => s.gpa));
    const avgAttendance = average(students.map((s) => s.attendance));
    const avgAssignments = average(students.map((s) => s.assignments));
    const atRisk = students.filter((s) => s.status === "At Risk");
    return {
      avgGpa,
      avgAttendance,
      avgAssignments,
      atRiskCount: atRisk.length,
      total: students.length,
    };
  }

  function generateGpaTrend(students) {
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const currentAvg = average(students.map((s) => s.gpa));

    // Use a RNG seeded from the current dataset (not the shared global stream)
    // so the trend line is stable across re-renders of the same filter
    // instead of reshuffling every time a control changes.
    const seed = Math.max(
      1,
      Math.round((currentAvg * 1000 + students.length) * 97),
    );
    const localRand = makeSeededRandom(seed);
    const localRange = (min, max) => min + localRand() * (max - min);

    // Walk backwards from current average with small plausible variance
    const trend = [];
    let value = currentAvg;
    for (let i = months.length - 1; i >= 0; i--) {
      trend[i] = { month: months[i], gpa: +value.toFixed(2) };
      value = value - localRange(-0.08, 0.14);
      value = Math.max(2.2, Math.min(3.9, value));
    }
    return trend;
  }

  /* ---------------------------------------------------------
     4. DOM references
     --------------------------------------------------------- */
  const statGrid = document.getElementById("statGrid");
  const gpaTrendChart = document.getElementById("gpaTrendChart");
  const gpaTrendTableBody = document.getElementById("gpaTrendTableBody");
  const distributionChart = document.getElementById("distributionChart");
  const distributionTableBody = document.getElementById(
    "distributionTableBody",
  );

  const studentSearch = document.getElementById("studentSearch");
  const performanceFilter = document.getElementById("performanceFilter");
  const sortSelect = document.getElementById("sortSelect");
  const cohortSelect = document.getElementById("cohortSelect");
  const studentTableBody = document.getElementById("studentTableBody");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");

  const atRiskGrid = document.getElementById("atRiskGrid");
  const riskCountBadge = document.getElementById("riskCountBadge");
  const insightsPanel = document.getElementById("insightsPanel");

  const modalOverlay = document.getElementById("modalOverlay");
  const studentModal = document.getElementById("studentModal");
  const modalClose = document.getElementById("modalClose");
  const modalStudentName = document.getElementById("modalStudentName");
  const modalStudentMeta = document.getElementById("modalStudentMeta");
  const modalStatusPill = document.getElementById("modalStatusPill");
  const modalGpa = document.getElementById("modalGpa");
  const modalAttendance = document.getElementById("modalAttendance");
  const modalAssignments = document.getElementById("modalAssignments");
  const modalUnits = document.getElementById("modalUnits");
  const modalCourseList = document.getElementById("modalCourseList");
  const modalAdvisory = document.getElementById("modalAdvisory");

  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  const liveRegion = document.getElementById("liveRegion");

  let lastFocusedElement = null;

  /* ---------------------------------------------------------
     5. Rendering: summary stat cards
     --------------------------------------------------------- */
  function renderStats(students) {
    const stats = computeStats(students);
    statGrid.innerHTML = "";

    const cards = [
      {
        hero: true,
        label: "Cohort Average GPA",
        value: stats.avgGpa.toFixed(2),
        delta: stats.avgGpa >= 3.0 ? "Above 3.00 target" : "Below 3.00 target",
        deltaClass: stats.avgGpa >= 3.0 ? "is-up" : "is-down",
      },
      {
        label: "Enrolled Students",
        value: String(stats.total),
        delta: "Current term",
        deltaClass: "is-flat",
      },
      {
        label: "Average Attendance",
        value: `${stats.avgAttendance.toFixed(0)}%`,
        delta: stats.avgAttendance >= 85 ? "Healthy range" : "Needs attention",
        deltaClass: stats.avgAttendance >= 85 ? "is-up" : "is-down",
      },
      {
        label: "At-Risk Students",
        value: String(stats.atRiskCount),
        delta:
          stats.total > 0
            ? `${((stats.atRiskCount / stats.total) * 100).toFixed(0)}% of cohort`
            : "No data",
        deltaClass: stats.atRiskCount > 0 ? "is-down" : "is-flat",
      },
    ];

    if (stats.total === 0) {
      statGrid.innerHTML = `<p class="empty-state">No students match the selected program filter.</p>`;
      return;
    }

    cards.forEach((c) => {
      const card = document.createElement("article");
      card.className = "stat-card" + (c.hero ? " is-hero" : "");
      card.innerHTML = `
        <span class="stat-label">${c.label}</span>
        <span class="stat-value">${c.value}</span>
        <span class="stat-delta ${c.deltaClass}">${c.delta}</span>
      `;
      statGrid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------
     6. Rendering: GPA trend line chart (hand-built SVG)
     --------------------------------------------------------- */
  function renderGpaTrend(students) {
    if (students.length === 0) {
      gpaTrendChart.innerHTML = `<p class="empty-state">No data for the selected program.</p>`;
      gpaTrendTableBody.innerHTML = "";
      return;
    }
    const data = generateGpaTrend(students);
    const width = 520,
      height = 220,
      padding = { top: 16, right: 16, bottom: 30, left: 34 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const minGpa = 2.0,
      maxGpa = 4.0;
    const xStep = plotW / (data.length - 1);

    const yFor = (gpa) =>
      padding.top + plotH - ((gpa - minGpa) / (maxGpa - minGpa)) * plotH;
    const xFor = (i) => padding.left + i * xStep;

    const points = data.map((d, i) => `${xFor(i)},${yFor(d.gpa)}`).join(" ");
    const areaPoints = `${padding.left},${padding.top + plotH} ${points} ${padding.left + plotW},${padding.top + plotH}`;

    let gridLines = "";
    let yLabels = "";
    for (let g = minGpa; g <= maxGpa; g += 0.5) {
      const y = yFor(g);
      gridLines += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.07)" stroke-width="1" />`;
      yLabels += `<text x="${padding.left - 8}" y="${y + 3}" text-anchor="end" font-size="9" fill="#7c83a8" font-family="ui-monospace, monospace">${g.toFixed(1)}</text>`;
    }

    let xLabels = "";
    data.forEach((d, i) => {
      xLabels += `<text x="${xFor(i)}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#7c83a8" font-family="-apple-system, sans-serif">${d.month}</text>`;
    });

    let dots = "";
    data.forEach((d, i) => {
      dots += `<circle cx="${xFor(i)}" cy="${yFor(d.gpa)}" r="3.5" fill="#d3a34c" stroke="#151a35" stroke-width="1.5" />`;
    });

    gpaTrendChart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        ${gridLines}
        <polygon points="${areaPoints}" fill="rgba(211,163,76,0.14)" stroke="none" />
        <polyline points="${points}" fill="none" stroke="#d3a34c" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        ${dots}
        ${yLabels}
        ${xLabels}
      </svg>
    `;

    gpaTrendTableBody.innerHTML = data
      .map((d) => `<tr><td>${d.month}</td><td>${d.gpa.toFixed(2)}</td></tr>`)
      .join("");
  }

  /* ---------------------------------------------------------
     7. Rendering: performance distribution donut chart
     --------------------------------------------------------- */
  const BAND_COLORS = {
    Excellent: "#52b087",
    Good: "#d3a34c",
    Average: "#e0a83e",
    "At Risk": "#e2685c",
  };

  function renderDistribution(students) {
    if (students.length === 0) {
      distributionChart.innerHTML = `<p class="empty-state">No data for the selected program.</p>`;
      distributionTableBody.innerHTML = "";
      return;
    }
    const bands = ["Excellent", "Good", "Average", "At Risk"];
    const counts = bands.map(
      (b) => students.filter((s) => s.status === b).length,
    );
    const total = students.length || 1;

    const size = 220,
      cx = size / 2,
      cy = size / 2,
      r = 78,
      strokeW = 26;
    const circumference = 2 * Math.PI * r;

    let offsetAccum = 0;
    let arcs = "";
    bands.forEach((band, i) => {
      const fraction = counts[i] / total;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BAND_COLORS[band]}"
        stroke-width="${strokeW}" stroke-dasharray="${dash} ${gap}"
        stroke-dashoffset="${-offsetAccum}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt" />`;
      offsetAccum += dash;
    });

    distributionChart.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeW}" />
        ${arcs}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="26" font-family="Georgia, serif" fill="#f2f3f9">${total}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="10" letter-spacing="0.05em" font-family="-apple-system, sans-serif" fill="#7c83a8">STUDENTS</text>
      </svg>
      <ul class="chart-legend">
        ${bands
          .map(
            (b, i) =>
              `<li><span class="legend-swatch" style="background:${BAND_COLORS[b]}"></span>${b} — ${counts[i]}</li>`,
          )
          .join("")}
      </ul>
    `;

    distributionTableBody.innerHTML = bands
      .map((b, i) => `<tr><td>${b}</td><td>${counts[i]}</td></tr>`)
      .join("");
  }

  /* ---------------------------------------------------------
     8. Rendering: student table
     --------------------------------------------------------- */
  function getFilteredStudents() {
    const query = studentSearch.value.trim().toLowerCase();
    const filterBand = performanceFilter.value;
    const cohort = cohortSelect.value;
    const sortBy = sortSelect.value;

    let list = STUDENTS.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query);
      const matchesBand = filterBand === "all" || s.status === filterBand;
      const matchesCohort = cohort === "all" || s.program === cohort;
      return matchesQuery && matchesBand && matchesCohort;
    });

    list = list.slice().sort((a, b) => {
      switch (sortBy) {
        case "gpa-desc":
          return b.gpa - a.gpa;
        case "gpa-asc":
          return a.gpa - b.gpa;
        case "attendance-asc":
          return a.attendance - b.attendance;
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }

  function statusClass(status) {
    return status.replace(" ", "-");
  }

  function renderStudentTable() {
    const list = getFilteredStudents();
    studentTableBody.innerHTML = "";

    if (list.length === 0) {
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }

    list.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="student-name-cell">
            <strong>${s.name}</strong>
            <span>${PROGRAM_LABELS[s.program]} • ${s.yearLevel}</span>
          </div>
        </td>
        <td><span style="font-family: var(--font-mono); font-size: 0.82rem;">${s.id}</span></td>
        <td>${s.program}</td>
        <td class="gpa-value">${s.gpa.toFixed(2)}</td>
        <td class="attendance-cell">${s.attendance}%</td>
        <td class="attendance-cell">${s.assignments}%</td>
        <td><span class="status-pill ${statusClass(s.status)}">${s.status}</span></td>
        <td><button type="button" class="row-view-btn" data-student-id="${s.id}">View details</button></td>
      `;
      studentTableBody.appendChild(tr);
    });

    resultCount.textContent = `Showing ${list.length} of ${STUDENTS.length} students`;
  }

  /* ---------------------------------------------------------
     9. Rendering: at-risk section
     --------------------------------------------------------- */
  function renderAtRisk() {
    const atRisk = STUDENTS.filter((s) => s.status === "At Risk");
    riskCountBadge.textContent = `${atRisk.length} flagged`;
    atRiskGrid.innerHTML = "";

    if (atRisk.length === 0) {
      const msg = document.createElement("p");
      msg.className = "no-risk-message";
      msg.textContent =
        "No students currently meet the at-risk thresholds. Great standing across the cohort.";
      atRiskGrid.appendChild(msg);
      return;
    }

    atRisk.forEach((s) => {
      const reasons = riskReasons(s.gpa, s.attendance);
      const card = document.createElement("article");
      card.className = "risk-card";
      card.innerHTML = `
        <h3>${s.name}</h3>
        <p class="risk-meta">${PROGRAM_LABELS[s.program]} • ${s.yearLevel} • ${s.id}</p>
        <p class="risk-meta">GPA ${s.gpa.toFixed(2)} · Attendance ${s.attendance}%</p>
        <div class="risk-reasons">
          ${reasons.map((r) => `<span class="risk-reason-chip">${r}</span>`).join("")}
        </div>
        <button type="button" class="row-view-btn" data-student-id="${s.id}">View full record</button>
      `;
      atRiskGrid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------
     10. Rendering: advisory insights
     --------------------------------------------------------- */
  function renderInsights() {
    const stats = computeStats(STUDENTS);
    const atRisk = STUDENTS.filter((s) => s.status === "At Risk");
    const excellent = STUDENTS.filter((s) => s.status === "Excellent");
    const lowestAttendance = STUDENTS.slice().sort(
      (a, b) => a.attendance - b.attendance,
    )[0];

    const notes = [
      `Cohort average GPA is <strong>${stats.avgGpa.toFixed(2)}</strong>, ${
        stats.avgGpa >= 3.0 ? "at or above" : "below"
      } the 3.00 department benchmark for the term.`,
      `<strong>${atRisk.length}</strong> student${atRisk.length === 1 ? "" : "s"} ${
        atRisk.length === 1 ? "is" : "are"
      } flagged at risk based on GPA and attendance thresholds and should be prioritized for advising.`,
      `<strong>${excellent.length}</strong> student${excellent.length === 1 ? "" : "s"} qualify for the Excellent band this term, eligible for recognition on the Dean's list review.`,
      lowestAttendance
        ? `${lowestAttendance.name} has the lowest recorded attendance in the cohort at <strong>${lowestAttendance.attendance}%</strong> and may need an outreach call.`
        : "",
    ].filter(Boolean);

    insightsPanel.innerHTML = `<ul>${notes.map((n) => `<li>${n}</li>`).join("")}</ul>`;
  }

  /* ---------------------------------------------------------
     11. Modal: open / close / focus trap
     --------------------------------------------------------- */
  function getAdvisoryNote(student) {
    if (student.status === "At Risk") {
      return `${student.name} is currently below one or more performance thresholds. Recommend scheduling an advising session to review course load and attendance barriers before the next grading period.`;
    }
    if (student.status === "Excellent") {
      return `${student.name} is performing at an excellent standard this term. Consider inviting them to peer tutoring or honors track opportunities.`;
    }
    if (student.status === "Good") {
      return `${student.name} is performing well and on track. No intervention needed; continue routine monitoring.`;
    }
    return `${student.name} is performing at an average level. Light check-ins are recommended to prevent decline before the midterm review.`;
  }

  function openModal(student) {
    lastFocusedElement = document.activeElement;

    modalStudentName.textContent = student.name;
    modalStudentMeta.textContent = `${PROGRAM_LABELS[student.program]} • ${student.yearLevel} • ${student.id}`;
    modalStatusPill.textContent = student.status;
    modalStatusPill.className = `status-pill ${statusClass(student.status)}`;
    modalGpa.textContent = student.gpa.toFixed(2);
    modalAttendance.textContent = `${student.attendance}%`;
    modalAssignments.textContent = `${student.assignments}%`;
    modalUnits.textContent = String(student.units);
    modalAdvisory.textContent = getAdvisoryNote(student);

    modalCourseList.innerHTML = student.courses
      .map(
        (c) =>
          `<li><span>${c.name}</span><span class="course-grade">${c.grade}</span></li>`,
      )
      .join("");

    modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    studentModal.focus();

    liveRegion.textContent = `Opened details for ${student.name}`;
  }

  function closeModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function getFocusableInModal() {
    return Array.from(
      studentModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled"));
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-student-id]");
    if (btn) {
      const student = STUDENTS.find((s) => s.id === btn.dataset.studentId);
      if (student) openModal(student);
    }
  });

  modalClose.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (modalOverlay.hidden) return;

    if (e.key === "Escape") {
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      const focusable = getFocusableInModal();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ---------------------------------------------------------
     12. Mobile navigation toggle
     --------------------------------------------------------- */
  navToggle.addEventListener("click", () => {
    const isOpen = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  primaryNav.addEventListener("click", (e) => {
    const link = e.target.closest(".sidenav-link");
    if (!link) return;

    document
      .querySelectorAll(".sidenav-link")
      .forEach((l) => l.classList.remove("is-active"));
    link.classList.add("is-active");

    if (window.innerWidth <= 900) {
      primaryNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 900 &&
      primaryNav.classList.contains("is-open") &&
      !primaryNav.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      primaryNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------------------------------------------------------
     13. Wire up filter/search/sort controls
     --------------------------------------------------------- */
  function refreshTableAndAnnounce() {
    renderStudentTable();
    const count = getFilteredStudents().length;
    liveRegion.textContent = `${count} student${count === 1 ? "" : "s"} match the current filters`;
  }

  studentSearch.addEventListener("input", refreshTableAndAnnounce);
  performanceFilter.addEventListener("change", refreshTableAndAnnounce);
  sortSelect.addEventListener("change", refreshTableAndAnnounce);
  cohortSelect.addEventListener("change", () => {
    const filtered = STUDENTS.filter(
      (s) => cohortSelect.value === "all" || s.program === cohortSelect.value,
    );
    renderStats(filtered);
    renderGpaTrend(filtered);
    renderDistribution(filtered);
    refreshTableAndAnnounce();
  });

  /* ---------------------------------------------------------
     14. Init
     --------------------------------------------------------- */
  function init() {
    renderStats(STUDENTS);
    renderGpaTrend(STUDENTS);
    renderDistribution(STUDENTS);
    renderStudentTable();
    renderAtRisk();
    renderInsights();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

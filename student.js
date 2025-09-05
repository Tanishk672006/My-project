(() => {
  "use strict";

  const NS = "aams";
  const ns = (k) => `${NS}:${k}`;
  const slug = (s) => s.toLowerCase().trim().replace(/\s+/g, "-");

  const load = (key, fallback) => {
    const v = localStorage.getItem(key);
    try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  };

  // Keys
  const kBranches = ns("branches");
  const kDivs = (b) => ns(`branch:${slug(b)}:divisions`);
  const kSubs = (b, d) => ns(`branch:${slug(b)}:division:${slug(d)}:subjects`);
  const kAttendance = (b, d, s, date) =>
    ns(`attendance:branch:${slug(b)}:division:${slug(d)}:subject:${slug(s)}:date:${date}`);

  // DOM elements
  const nameEl = document.getElementById("studentName");
  const rollEl = document.getElementById("studentRoll");
  const branchEl = document.getElementById("studentBranch");
  const divEl = document.getElementById("studentDivision");
  const todayStatusEl = document.getElementById("todayStatus");
  const historyTable = document.querySelector("#historyTable tbody");
  const chartEl = document.getElementById("attendanceChart");
  const alertEl = document.getElementById("alertMessage");
  const notificationsEl = document.getElementById("notificationList");
  const logoutBtn = document.getElementById("logoutBtn");

  // Current user (from login.js)
  const user = JSON.parse(localStorage.getItem("aamsCurrentUser"));
  if (!user || user.role !== "student") {
    window.location.href = "index.html"; // force login
  }

  // Fill profile
  nameEl.textContent = user.name;
  rollEl.textContent = user.rollNo || "--";
  branchEl.textContent = user.branch || "--";
  divEl.textContent = user.division || "--";

  // Collect attendance
  function getAttendanceData(branch, division, rollNo) {
    let records = [];
    const subjects = load(kSubs(branch, division), []);
    subjects.forEach(sub => {
      // Go through all dates
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(ns(`attendance:branch:${slug(branch)}:division:${slug(division)}:subject:${slug(sub)}`))) {
          const data = load(key, {});
          if (data[rollNo]) {
            const date = key.split(":date:")[1];
            records.push({ date, subject: sub, status: data[rollNo] });
          }
        }
      }
    });
    return records.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const today = new Date().toISOString().split("T")[0];
  const records = getAttendanceData(user.branch, user.division, user.rollNo);

  // Today’s attendance
  const todayRecord = records.find(r => r.date === today);
  todayStatusEl.textContent = todayRecord
    ? `You are marked ${todayRecord.status.toUpperCase()}`
    : "No attendance marked today";

  // History table
  historyTable.innerHTML = "";
  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.subject}</td>
      <td style="color:${r.status === "present" ? "green" : "red"}">
        ${r.status}
      </td>
    `;
    historyTable.appendChild(tr);
  });

  // Analytics chart
  const subjectStats = {};
  records.forEach(r => {
    if (!subjectStats[r.subject]) subjectStats[r.subject] = { present: 0, total: 0 };
    subjectStats[r.subject].total++;
    if (r.status === "present") subjectStats[r.subject].present++;
  });

  const labels = Object.keys(subjectStats);
  const percentages = labels.map(sub => {
    const { present, total } = subjectStats[sub];
    return total > 0 ? Math.round((present / total) * 100) : 0;
  });

  new Chart(chartEl, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attendance %",
        data: percentages
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });

  // Notifications (low attendance)
  notificationsEl.innerHTML = "";
  labels.forEach((sub, i) => {
    if (percentages[i] < 75) {
      const li = document.createElement("li");
      li.textContent = `⚠ Low attendance in ${sub}: ${percentages[i]}%`;
      notificationsEl.appendChild(li);
    }
  });

  // Alert message
  alertEl.textContent = notificationsEl.children.length
    ? "⚠ Warning: Some subjects have low attendance!"
    : "";

  // Logout
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("aamsCurrentUser");
  window.location.href = "main login.html";
});

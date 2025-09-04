// manage-students.js
(() => {
  "use strict";

  // -------------------- UTIL / STORAGE --------------------
  const NS = "aams";
  const ns = (k) => `${NS}:${k}`;
  const slug = (s) => s.toLowerCase().trim().replace(/\s+/g, "-");

  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const load = (key, fallback) => {
    const v = localStorage.getItem(key);
    try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  };

  // keys:
  // aams:branches -> [branchName]
  // aams:branch:{b}:divisions -> [divisionName]
  // aams:branch:{b}:division:{d}:subjects -> [subjectName]
  // aams:branch:{b}:division:{d}:subject:{s}:students -> [{rollNo, name}]
  const kBranches = ns("branches");
  const kDivs = (b) => ns(`branch:${slug(b)}:divisions`);
  const kSubs = (b, d) => ns(`branch:${slug(b)}:division:${slug(d)}:subjects`);
  const kStud = (b, d, s) =>
    ns(`branch:${slug(b)}:division:${slug(d)}:subject:${slug(s)}:students`);

  // -------------------- DOM --------------------
  const $ = (sel) => document.querySelector(sel);

  // Branch
  const branchForm = $("#branchForm");
  const branchNameInput = $("#branchName");
  const branchList = $("#branchList");
  const branchSelect = $("#branchSelect");
  const branchSelectForSubject = $("#branchSelectForSubject");
  const branchSelectForStudent = $("#branchSelectForStudent");

  // Division
  const divisionForm = $("#divisionForm");
  const divisionNameInput = $("#divisionName");
  const divisionList = $("#divisionList");
  const divisionSelectForSubject = $("#divisionSelectForSubject");
  const divisionSelectForStudent = $("#divisionSelectForStudent");

  // Subject
  const subjectForm = $("#subjectForm");
  const subjectNameInput = $("#subjectName");
  const subjectList = $("#subjectList");
  const subjectSelectForStudent = $("#subjectSelectForStudent");

  // Student
  const studentForm = $("#studentForm");
  const rollNoInput = $("#rollNo");
  const studentNameInput = $("#studentName");
  const studentTableBody = document.querySelector("#studentTable tbody");

  // -------------------- RENDER HELPERS --------------------
  function getBranches() { return load(kBranches, []); }
  function setBranches(arr) { save(kBranches, arr); }

  function getDivisions(branch) { return load(kDivs(branch), []); }
  function setDivisions(branch, arr) { save(kDivs(branch), arr); }

  function getSubjects(branch, division) { return load(kSubs(branch, division), []); }
  function setSubjects(branch, division, arr) { save(kSubs(branch, division), arr); }

  function getStudents(branch, division, subject) { return load(kStud(branch, division, subject), []); }
  function setStudents(branch, division, subject, arr) { save(kStud(branch, division, subject), arr); }

  function addUnique(list, value) {
    const exists = list.some(v => v.trim().toLowerCase() === value.trim().toLowerCase());
    if (!exists) list.push(value.trim());
    return list;
  }

  // --- Populate selects
  function populateBranchSelects() {
    [branchSelect, branchSelectForSubject, branchSelectForStudent].forEach(sel => {
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = `<option value="">Select Branch</option>`;
      getBranches().forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        sel.appendChild(opt);
      });
      if (Array.from(sel.options).some(o => o.value === current)) sel.value = current;
    });
  }

  function populateDivisionOptions(targetSelect, branch) {
    targetSelect.innerHTML = `<option value="">Select Division</option>`;
    if (!branch) return;
    getDivisions(branch).forEach(d => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      targetSelect.appendChild(opt);
    });
  }

  function populateSubjectOptions(targetSelect, branch, division) {
    targetSelect.innerHTML = `<option value="">Select Subject</option>`;
    if (!branch || !division) return;
    getSubjects(branch, division).forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      targetSelect.appendChild(opt);
    });
  }

  // --- Lists on page
  function renderBranchList() {
    branchList.innerHTML = "";
    getBranches().forEach(b => {
      const li = document.createElement("li");
      li.textContent = b;
      branchList.appendChild(li);
    });
  }

  function renderDivisionList() {
    divisionList.innerHTML = "";
    getBranches().forEach(b => {
      getDivisions(b).forEach(d => {
        const li = document.createElement("li");
        li.textContent = `${b} - ${d}`;
        divisionList.appendChild(li);
      });
    });
  }

  function renderSubjectList() {
    subjectList.innerHTML = "";
    getBranches().forEach(b => {
      getDivisions(b).forEach(d => {
        getSubjects(b, d).forEach(s => {
          const li = document.createElement("li");
          li.textContent = `${b} - ${d} : ${s}`;
          subjectList.appendChild(li);
        });
      });
    });
  }

  function renderStudentsTable(branch, division, subject) {
    studentTableBody.innerHTML = "";
    if (!branch || !division || !subject) return;
    const data = getStudents(branch, division, subject);
    data.forEach((st, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${st.rollNo}</td>
        <td>${st.name}</td>
        <td>${branch}</td>
        <td>${division}</td>
        <td>${subject}</td>
        <td><button data-role="delete-student" data-index="${idx}">🗑 Delete</button></td>
      `;
      studentTableBody.appendChild(tr);
    });
  }

  // -------------------- EVENTS --------------------
  // Branch add
  branchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = branchNameInput.value.trim();
    if (!name) return;

    const branches = getBranches();
    addUnique(branches, name);
    setBranches(branches);

    // ensure empty divisions list exists
    setDivisions(name, getDivisions(name)); // creates key if missing

    renderBranchList();
    populateBranchSelects();
    branchForm.reset();
  });

  // Division add
  divisionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const b = branchSelect.value;
    const d = divisionNameInput.value.trim();
    if (!b || !d) return;

    const divs = getDivisions(b);
    addUnique(divs, d);
    setDivisions(b, divs);

    // ensure empty subjects list exists
    setSubjects(b, d, getSubjects(b, d));

    renderDivisionList();
    populateDivisionOptions(divisionSelectForSubject, b);
    populateDivisionOptions(divisionSelectForStudent, b);
    divisionForm.reset();
  });

  // Subject add
  subjectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const b = branchSelectForSubject.value;
    const d = divisionSelectForSubject.value;
    const s = subjectNameInput.value.trim();
    if (!b || !d || !s) return;

    const subs = getSubjects(b, d);
    addUnique(subs, s);
    setSubjects(b, d, subs);

    // ensure empty students list exists
    setStudents(b, d, s, getStudents(b, d, s));

    renderSubjectList();
    populateSubjectOptions(subjectSelectForStudent, b, d);
    subjectForm.reset();
  });

  // Student add
  studentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const b = branchSelectForStudent.value;
    const d = divisionSelectForStudent.value;
    const s = subjectSelectForStudent.value;
    const roll = rollNoInput.value.trim();
    const name = studentNameInput.value.trim();
    if (!b || !d || !s || !roll || !name) return;

    const arr = getStudents(b, d, s);
    // prevent duplicate roll in same (b,d,s)
    const exists = arr.some(x => (x.rollNo + "").trim().toLowerCase() === roll.toLowerCase());
    if (!exists) {
      arr.push({ rollNo: roll, name });
      setStudents(b, d, s, arr);
      renderStudentsTable(b, d, s);
      studentForm.reset();
    } else {
      alert("Roll No already exists for this Branch/Division/Subject.");
    }
  });

  // Delete student (event delegation)
  studentTableBody.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-role="delete-student"]');
    if (!btn) return;
    const idx = +btn.getAttribute("data-index");
    const b = branchSelectForStudent.value;
    const d = divisionSelectForStudent.value;
    const s = subjectSelectForStudent.value;
    const arr = getStudents(b, d, s);
    arr.splice(idx, 1);
    setStudents(b, d, s, arr);
    renderStudentsTable(b, d, s);
  });

  // Select change -> cascade + render
  branchSelect.addEventListener("change", () => {
    populateDivisionOptions(divisionSelectForSubject, branchSelect.value);
  });

  branchSelectForSubject.addEventListener("change", () => {
    populateDivisionOptions(divisionSelectForSubject, branchSelectForSubject.value);
    // Clear subjects list in the subject form until division picked
    populateSubjectOptions(subjectSelectForStudent, "", "");
  });

  divisionSelectForSubject.addEventListener("change", () => {
    populateSubjectOptions(subjectSelectForStudent, branchSelectForSubject.value, divisionSelectForSubject.value);
  });

  branchSelectForStudent.addEventListener("change", () => {
    populateDivisionOptions(divisionSelectForStudent, branchSelectForStudent.value);
    populateSubjectOptions(subjectSelectForStudent, "", "");
    renderStudentsTable(); // clear table until subject chosen
  });

  divisionSelectForStudent.addEventListener("change", () => {
    populateSubjectOptions(subjectSelectForStudent, branchSelectForStudent.value, divisionSelectForStudent.value);
    renderStudentsTable(); // clear until subject chosen
  });

  subjectSelectForStudent.addEventListener("change", () => {
    renderStudentsTable(branchSelectForStudent.value, divisionSelectForStudent.value, subjectSelectForStudent.value);
  });

  // -------------------- INITIALIZE --------------------
  function init() {
    // ensure base key exists
    setBranches(getBranches());

    renderBranchList();
    renderDivisionList();
    renderSubjectList();

    populateBranchSelects();
    // do not preselect; keep selects empty until user picks
    studentTableBody.innerHTML = "";
    // sanity log (optional)
    // console.log("AAMS Teacher Console ready");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

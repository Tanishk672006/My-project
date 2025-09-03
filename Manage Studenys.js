// Load from localStorage or start fresh
let branches = JSON.parse(localStorage.getItem("branches")) || {};
let editStudent = null;

// Save data
function saveData() {
  localStorage.setItem("branches", JSON.stringify(branches));
}

// Add Branch
document.getElementById("branchForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("branchName").value.trim();
  if(name && !branches[name]) {
    branches[name] = {};
    saveData();
    updateUI();
  }
  e.target.reset();
});

// Add Division
document.getElementById("divisionForm").addEventListener("submit", e => {
  e.preventDefault();
  const branch = document.getElementById("branchSelect").value;
  const div = document.getElementById("divisionName").value.trim();
  if(branch && div && !branches[branch][div]) {
    branches[branch][div] = {};
    saveData();
    updateUI();
  }
  e.target.reset();
});

// Add Subject
document.getElementById("subjectForm").addEventListener("submit", e => {
  e.preventDefault();
  const branch = document.getElementById("branchSelectForSubject").value;
  const div = document.getElementById("divisionSelectForSubject").value;
  const subj = document.getElementById("subjectName").value.trim();
  if(branch && div && subj && !branches[branch][div][subj]) {
    branches[branch][div][subj] = [];
    saveData();
    updateUI();
  }
  e.target.reset();
});

// Add Student
document.getElementById("studentForm").addEventListener("submit", e => {
  e.preventDefault();
  const branch = document.getElementById("branchSelectForStudent").value;
  const div = document.getElementById("divisionSelectForStudent").value;
  const subj = document.getElementById("subjectSelectForStudent").value;
  const roll = document.getElementById("rollNo").value.trim();
  const name = document.getElementById("studentName").value.trim();

  if(branch && div && subj && roll && name) {
    if(editStudent) {
      Object.assign(editStudent,{rollNo:roll,name});
      editStudent=null;
    } else {
      branches[branch][div][subj].push({rollNo:roll,name,branch,division:div,subject:subj});
    }
    saveData();
    updateUI();
  }
  e.target.reset();
});

// Edit / Delete student
document.querySelector("#studentTable tbody").addEventListener("click", e => {
  const row = e.target.closest("tr");
  if(!row) return;
  const roll=row.dataset.roll,branch=row.dataset.branch,div=row.dataset.division,subj=row.dataset.subject;
  if(e.target.classList.contains("edit-btn")){
    const st = branches[branch][div][subj].find(s=>s.rollNo===roll);
    document.getElementById("branchSelectForStudent").value=branch;
    updateDivisionDropdowns();
    document.getElementById("divisionSelectForStudent").value=div;
    updateSubjectDropdowns();
    document.getElementById("subjectSelectForStudent").value=subj;
    document.getElementById("rollNo").value=st.rollNo;
    document.getElementById("studentName").value=st.name;
    editStudent=st;
  }
  if(e.target.classList.contains("delete-btn")){
    branches[branch][div][subj]=branches[branch][div][subj].filter(s=>s.rollNo!==roll);
    saveData(); updateUI();
  }
});

// Dropdown Updaters
function updateBranchDropdowns(){
  const ids=["branchSelect","branchSelectForSubject","branchSelectForStudent"];
  ids.forEach(id=>{
    const sel=document.getElementById(id);
    sel.innerHTML="";
    Object.keys(branches).forEach(b=>{
      const opt=document.createElement("option");
      opt.value=b; opt.textContent=b; sel.appendChild(opt);
    });
  });
}
function updateDivisionDropdowns(){
  const branch=document.getElementById("branchSelectForSubject").value||document.getElementById("branchSelectForStudent").value;
  const divSel1=document.getElementById("divisionSelectForSubject");
  const divSel2=document.getElementById("divisionSelectForStudent");
  [divSel1,divSel2].forEach(sel=>{
    sel.innerHTML="";
    if(branch && branches[branch]){
      Object.keys(branches[branch]).forEach(d=>{
        const opt=document.createElement("option");
        opt.value=d; opt.textContent=d; sel.appendChild(opt);
      });
    }
  });
}
function updateSubjectDropdowns(){
  const branch=document.getElementById("branchSelectForStudent").value;
  const div=document.getElementById("divisionSelectForStudent").value;
  const subjSel=document.getElementById("subjectSelectForStudent");
  subjSel.innerHTML="";
  if(branch && div && branches[branch][div]){
    Object.keys(branches[branch][div]).forEach(s=>{
      const opt=document.createElement("option");
      opt.value=s; opt.textContent=s; subjSel.appendChild(opt);
    });
  }
}

// Display UI
function updateUI(){
  // Branch list
  document.getElementById("branchList").innerHTML=Object.keys(branches).map(b=>`<li>${b}</li>`).join("");
  // Division list
  let divs=[]; for(let b in branches) for(let d in branches[b]) divs.push(`${b} → ${d}`);
  document.getElementById("divisionList").innerHTML=divs.map(v=>`<li>${v}</li>`).join("");
  // Subject list
  let subs=[]; for(let b in branches) for(let d in branches[b]) for(let s in branches[b][d]) subs.push(`${b} → ${d} → ${s}`);
  document.getElementById("subjectList").innerHTML=subs.map(v=>`<li>${v}</li>`).join("");

  // Student table
  const tbody=document.querySelector("#studentTable tbody");
  tbody.innerHTML="";
  for(let b in branches) for(let d in branches[b]) for(let s in branches[b][d]){
    branches[b][d][s].forEach(st=>{
      const row=document.createElement("tr");
      row.dataset={roll:st.rollNo,branch:b,division:d,subject:s};
      row.innerHTML=`
        <td>${st.rollNo}</td>
        <td>${st.name}</td>
        <td>${b}</td>
        <td>${d}</td>
        <td>${s}</td>
        <td>
          <button class="action-btn edit-btn">Edit</button>
          <button class="action-btn delete-btn">Delete</button>
        </td>`;
      tbody.appendChild(row);
    });
  }
  updateBranchDropdowns();
  updateDivisionDropdowns();
  updateSubjectDropdowns();
}

// Hook dropdown changes
document.getElementById("branchSelectForSubject").addEventListener("change",updateDivisionDropdowns);
document.getElementById("branchSelectForStudent").addEventListener("change",updateDivisionDropdowns);
document.getElementById("divisionSelectForStudent").addEventListener("change",updateSubjectDropdowns);

// Initial load
updateUI();

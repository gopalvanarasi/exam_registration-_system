async function loadAdminDashboard(){
  if(!requireRole("admin"))return;
  document.getElementById("welcome").textContent=`Hi, ${getUser().name}`;
  await Promise.all([loadRegistrations(),loadReports(),loadStudents()]);
}
async function loadRegistrations(){
  const el=document.getElementById("registrations");
  try{
    const data=await api("/admin/registrations");const rows=data.registrations;
    document.getElementById("totalCount").textContent=rows.length;
    document.getElementById("pendingCount").textContent=rows.filter(x=>x.status==="Pending").length;
    document.getElementById("approvedCount").textContent=rows.filter(x=>x.status==="Approved").length;
    document.getElementById("rejectedCount").textContent=rows.filter(x=>x.status==="Rejected").length;
    if(!rows.length){el.innerHTML='<div class="empty">No applications received yet.</div>';return;}
    el.innerHTML=`<table><thead><tr><th>Student</th><th>Roll number</th><th>Exam</th><th>Applied</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHTML(r.student_name)}</td><td>${escapeHTML(r.roll_no)}</td><td>${escapeHTML(r.exam_title)}</td><td>${formatDate(r.applied_at)}</td><td><span class="status ${r.status}">${r.status}</span></td><td>${r.status==="Pending"?`<button class="table-button approve" onclick="reviewRegistration(${r.id},'Approved')">Approve</button><button class="table-button reject" onclick="reviewRegistration(${r.id},'Rejected')">Reject</button>`:"—"}</td></tr>`).join("")}</tbody></table>`;
  }catch(err){el.textContent=err.message;}
}
async function reviewRegistration(id,status){
  if(!confirm(`${status} this application?`))return;
  try{await api(`/admin/registrations/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});await loadAdminDashboard();}
  catch(err){alert(err.message);}
}
async function loadReports(){
  const el=document.getElementById("reports");
  try{
    const data=await api("/admin/reports");const s=data.summary;
    if(!document.getElementById("totalCount").textContent||document.getElementById("totalCount").textContent==="—"){
      document.getElementById("totalCount").textContent=s.total||0;
    }
    el.innerHTML=data.byExam.length?`<table><thead><tr><th>Exam</th><th>Total</th><th>Approved</th><th>Pending</th><th>Rejected</th></tr></thead><tbody>${data.byExam.map(r=>`<tr><td>${escapeHTML(r.title)} (${escapeHTML(r.exam_code)})</td><td>${r.total_registrations||0}</td><td>${r.approved||0}</td><td>${r.pending||0}</td><td>${r.rejected||0}</td></tr>`).join("")}</tbody></table>`:'<div class="empty">Create an exam to see reports.</div>';
  }catch(err){el.textContent=err.message;}
}
async function loadStudents(){
  const el=document.getElementById("students");
  try{
    const data=await api("/admin/students");
    el.innerHTML=data.students.length?`<table><thead><tr><th>Name</th><th>Roll number</th><th>Email</th><th>Course</th><th>Semester</th></tr></thead><tbody>${data.students.map(s=>`<tr><td>${escapeHTML(s.name)}</td><td>${escapeHTML(s.roll_no)}</td><td>${escapeHTML(s.email)}</td><td>${escapeHTML(s.course)}</td><td>${s.semester}</td></tr>`).join("")}</tbody></table>`:'<div class="empty">No students have registered yet.</div>';
  }catch(err){el.textContent=err.message;}
}
document.getElementById("examForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));data.semester=Number(data.semester);
  try{const result=await api("/exams",{method:"POST",body:JSON.stringify(data)});showMessage(document.getElementById("examMessage"),result.message,true);form.reset();loadAdminDashboard();}
  catch(err){showMessage(document.getElementById("examMessage"),err.message);}
});
if(document.getElementById("registrations"))loadAdminDashboard();

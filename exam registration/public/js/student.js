let currentRegistrations=[];
async function loadStudentDashboard(){
  if(!requireRole("student"))return;
  const user=getUser();document.getElementById("welcome").textContent=`Hi, ${user.name}`;
  try{
    const [examData,regData]=await Promise.all([api("/exams"),api("/registrations/mine")]);
    currentRegistrations=regData.registrations;
    document.getElementById("totalCount").textContent=currentRegistrations.length;
    document.getElementById("pendingCount").textContent=currentRegistrations.filter(x=>x.status==="Pending").length;
    document.getElementById("approvedCount").textContent=currentRegistrations.filter(x=>x.status==="Approved").length;
    renderExams(examData.exams);renderMyRegistrations(currentRegistrations);
  }catch(err){document.getElementById("examList").textContent=err.message;}
}
function renderExams(exams){
  const user=getUser();const eligible=exams.filter(e=>e.course.toLowerCase()===String(user.course).toLowerCase()&&Number(e.semester)===Number(user.semester));
  const el=document.getElementById("examList");
  if(!eligible.length){el.innerHTML='<div class="empty">No examinations are currently available for your course and semester.</div>';return;}
  el.innerHTML=`<table><thead><tr><th>Exam</th><th>Date & time</th><th>Venue</th><th>Registration</th><th>Action</th></tr></thead><tbody>${eligible.map(e=>`<tr><td><b>${escapeHTML(e.title)}</b><br><small>${escapeHTML(e.exam_code)}</small></td><td>${formatDate(e.exam_date)} · ${escapeHTML(String(e.exam_time).slice(0,5))}</td><td>${escapeHTML(e.venue)}</td><td>${e.registration_open?'<span class="status Approved">Open</span>':'<span class="status Rejected">Closed</span>'}</td><td><button class="button small" ${!e.registration_open?'disabled':''} onclick="applyExam(${e.id})">Apply</button></td></tr>`).join("")}</tbody></table>`;
}
function renderMyRegistrations(rows){
  const el=document.getElementById("myRegistrations");
  if(!rows.length){el.innerHTML='<div class="empty">You have not applied for any examination yet.</div>';return;}
  el.innerHTML=`<table><thead><tr><th>Registration ID</th><th>Examination</th><th>Applied on</th><th>Status</th><th>Hall ticket</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHTML(r.registration_no)}</td><td>${escapeHTML(r.title)}</td><td>${formatDate(r.applied_at)}</td><td><span class="status ${r.status}">${r.status}</span></td><td>${r.status==="Approved"?`<a href="/hall-ticket.html?id=${r.id}">View ticket →</a>`:"—"}</td></tr>`).join("")}</tbody></table>`;
}
async function applyExam(examId){
  if(!confirm("Submit your application for this examination?"))return;
  try{const result=await api("/registrations",{method:"POST",body:JSON.stringify({examId})});alert(`${result.message}\nRegistration ID: ${result.registrationNo}`);loadStudentDashboard();}
  catch(err){alert(err.message);}
}
async function loadHallTicket(){
  if(!requireRole("student"))return;
  const id=new URLSearchParams(location.search).get("id");const target=document.getElementById("ticket");
  if(!id){target.textContent="No registration selected.";return;}
  try{
    const data=await api(`/registrations/hall-ticket/${encodeURIComponent(id)}`);const t=data.hallTicket;
    target.innerHTML=`<div class="ticket-title"><p class="eyebrow">OFFICIAL EXAMINATION DOCUMENT</p><h1>EXAMINATION HALL TICKET</h1><p>Academic Examination Registration System</p></div><div class="ticket-grid">${[
      ["Student name",t.name],["Roll number",t.roll_no],["Course",t.course],["Semester",t.semester],["Exam title",t.title],["Exam code",t.exam_code],["Exam date",formatDate(t.exam_date)],["Exam time",String(t.exam_time).slice(0,5)],["Venue",t.venue],["Registration number",t.registration_no],["Hall ticket number",t.ticket_no]
    ].map(([k,v])=>`<div class="ticket-field"><small>${escapeHTML(k)}</small><b>${escapeHTML(v)}</b></div>`).join("")}</div><p class="ticket-note">Please carry this hall ticket and your valid college identity card to the examination hall. Report to the venue before the scheduled examination time.</p>`;
  }catch(err){target.textContent=err.message;}
}
if(document.getElementById("examList"))loadStudentDashboard();

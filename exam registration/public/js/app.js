const API = "/api";
function getToken(){ return localStorage.getItem("examToken"); }
function getUser(){ try{return JSON.parse(localStorage.getItem("examUser")||"null");}catch{return null;} }
function logout(){localStorage.removeItem("examToken");localStorage.removeItem("examUser");window.location.href="/login.html";}
async function api(path, options={}) {
  const headers = { "Content-Type":"application/json", ...(options.headers||{}) };
  if(getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const response = await fetch(`${API}${path}`, {...options, headers});
  const data = await response.json().catch(()=>({message:"Unexpected server response."}));
  if(response.status===401){logout();throw new Error(data.message||"Please log in again.");}
  if(!response.ok) throw new Error(data.message||"Request failed.");
  return data;
}
function requireRole(role){
  const user=getUser();
  if(!getToken()||!user){window.location.href="/login.html";return false;}
  if(user.role!==role){window.location.href=user.role==="admin"?"/admin.html":"/dashboard.html";return false;}
  return true;
}
function showMessage(element,message,success=false){if(!element)return;element.textContent=message;element.className=success?"message success":"message";}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function formatDate(value){return value?new Date(value).toLocaleDateString():"—";}

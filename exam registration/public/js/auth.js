const loginForm=document.getElementById("loginForm");
if(loginForm) loginForm.addEventListener("submit",async e=>{
  e.preventDefault();const message=document.getElementById("message");const form=Object.fromEntries(new FormData(loginForm));
  try{
    const data=await api("/auth/login",{method:"POST",body:JSON.stringify(form)});
    localStorage.setItem("examToken",data.token);localStorage.setItem("examUser",JSON.stringify(data.user));
    window.location.href=data.user.role==="admin"?"/admin.html":"/dashboard.html";
  }catch(err){showMessage(message,err.message);}
});
const registerForm=document.getElementById("registerForm");
if(registerForm) registerForm.addEventListener("submit",async e=>{
  e.preventDefault();const message=document.getElementById("message");const form=Object.fromEntries(new FormData(registerForm));
  form.semester=Number(form.semester);
  try{
    const data=await api("/auth/register",{method:"POST",body:JSON.stringify(form)});
    showMessage(message,data.message,true);registerForm.reset();
  }catch(err){showMessage(message,err.message);}
});

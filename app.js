(function(){
var S=window.SITE,app=document.getElementById("app"),A=[],ST={banner:{on:false,text:"",link:""},about:"",discord:"",links:[],accounts:[]},T="gh_token",TM=null,FL="",O=S.repo;
var API="https://api.github.com/repos/"+O.owner+"/"+O.name+"/contents/",SITE=S.siteUrl||("https://"+O.owner+".github.io/"+O.name+"/");
var DC=function(){return ST.discord||S.discord};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
var ss=function(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){return null}};
var sha=function(t){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")})};
var $=function(i){return document.getElementById(i)};
var b64=function(s){return btoa(unescape(encodeURIComponent(s)))};
function fmt(d){var x=new Date(d);return isNaN(x)?d:x.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
function nowLocal(){return new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}
function url(u){return/^(https?:\/\/|images\/|\/|#)/.test(u)?u:"#"}
function md(t){
  var h=esc(t).replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,function(m,a,u){return '<img src="'+url(u)+'" alt="'+a+'">'})
   .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,function(m,a,u){return '<a href="'+url(u)+'" target="_blank" rel="noopener noreferrer">'+a+'</a>'})
   .replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/\*([^*]+)\*/g,"<i>$1</i>");
  return h.split(/\n\s*\n/).map(function(p){p=p.trim();var m=p.match(/^(#{1,4}) (.+)$/);if(m){var n=m[1].length+1;return "<h"+n+">"+m[2]+"</h"+n+">"}if(p==="---")return"<hr>";return p?"<p>"+p.replace(/\n/g,"<br>")+"</p>":""}).join("");
}
function accts(){return S.accounts.map(function(a){return Object.assign({},a,{admin:true,src:"config"})}).concat((ST.accounts||[]).map(function(a){return Object.assign({},a,{src:"settings"})}))}
function team(){
  if(TM)return TM;var AC=accts(),ids=AC.map(function(a){return a.id});
  var j=function(p){return p.then(function(r){return r.json()}).then(function(d){return d.data||[]}).catch(function(){return[]})};
  TM=Promise.all([j(fetch("https://users.roproxy.com/v1/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userIds:ids,excludeBannedUsers:false})})),j(fetch("https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds="+ids.join(",")+"&size=150x150&format=Png"))]).then(function(r){
    var m={};r[0].forEach(function(u){m[u.id]={name:u.name}});r[1].forEach(function(t){(m[t.targetId]=m[t.targetId]||{}).img=t.imageUrl});
    return AC.map(function(a){var u=m[a.id]||{};return{id:a.id,name:u.name||a.name||"Staff",img:u.img||"",position:a.position,hash:a.passwordHash,admin:!!a.admin,src:a.src}})});
  return TM;
}
/* GitHub */
function gh(p,o,tok){o=o||{};o.headers={Authorization:"Bearer "+tok,Accept:"application/vnd.github+json"};return fetch(API+p,o)}
function getJson(p,tok,d){return gh(p+"?ref="+O.branch,{},tok).then(function(r){if(r.status===404)return{sha:null,data:d};if(!r.ok)throw new Error("GitHub error "+r.status+". Check the token and the repo in config.js.");return r.json().then(function(f){return{sha:f.sha,data:JSON.parse(decodeURIComponent(escape(atob(f.content.replace(/\n/g,"")))))}})})}
function put(p,c,msg,sh,tok){var b={message:msg,branch:O.branch,content:c};if(sh)b.sha=sh;return gh(p,{method:"PUT",body:JSON.stringify(b)},tok).then(function(r){if(!r.ok)throw new Error("Save failed ("+r.status+"). The token needs Contents read and write access.")})}
function save(f,tok,fn,msg,d){return getJson(f,tok,d).then(function(x){return put(f,b64(JSON.stringify(fn(x.data),null,2)),msg,x.sha,tok)})}
function shaOf(p,tok){return gh(p+"?ref="+O.branch,{},tok).then(function(r){return r.ok?r.json().then(function(f){return f.sha}):null})}
function wfile(p,c,msg,tok){return shaOf(p,tok).then(function(s){return put(p,c,msg,s,tok)})}
function dfile(p,msg,tok){return shaOf(p,tok).then(function(s){if(s)return gh(p,{method:"DELETE",body:JSON.stringify({message:msg,branch:O.branch,sha:s})},tok)})}
function share(a){var im=a.image?(/^https?:/.test(a.image)?a.image:SITE+a.image):"",u=SITE+"#/a/"+a.id;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+esc(a.title)+'</title><meta property="og:type" content="article"><meta property="og:site_name" content="'+esc(S.name)+'"><meta property="og:title" content="'+esc(a.title)+'"><meta property="og:description" content="'+esc((a.tag?a.tag+": ":"")+(a.summary||""))+'">'+(im?'<meta property="og:image" content="'+esc(im)+'">':'')+'<meta name="twitter:card" content="summary_large_image"><meta http-equiv="refresh" content="0;url='+esc(u)+'"></head><body><a href="'+esc(u)+'">Read the story</a></body></html>'}
function saveShare(a,tok){return wfile("p/"+a.id+"/index.html",b64(share(a)),"Share page: "+a.title,tok)}
function tok(){return ss(T)}
function saveST(fn,msg){var t=tok();if(!t){go("#/dashboard");return Promise.reject(new Error("Your GitHub token is missing."))}var p;return save("settings.json",t,function(cur){p=fn(cur||{});return Object.assign({},cur,p)},msg,{}).then(function(){ST=Object.assign({},ST,p);TM=null})}
/* views */
function meta(a){return '<small>By '+esc(a.author)+', '+esc(fmt(a.date))+'</small>'}
function im(a){return '<div class="im"'+(a.image?' style="background-image:url(\''+esc(url(a.image))+'\')"':'')+'>'+(a.image?'':esc(a.category.charAt(0)))+'</div>'}
function tag(a){return a.tag?'<span class="tagc">'+esc(a.tag)+'</span>':''}
function card(a){return '<a class="card" href="#/a/'+esc(a.id)+'">'+im(a)+'<h3>'+esc(a.title)+'</h3><p>'+esc(a.summary)+'</p>'+meta(a)+'</a>'}
function disc(){return DC()?'<aside class="disc"><div><h3>Join our Discord</h3><p>Talk to the newsroom and the rest of the community.</p></div><a class="btn" href="'+esc(DC())+'" target="_blank" rel="noopener noreferrer">Join Discord</a></aside>':''}
function shell(html,r){
  var cats='<a href="#/"'+(r===""?' class="on"':'')+'>Home</a>'+S.categories.map(function(c){return '<a href="#/cat/'+encodeURIComponent(c)+'"'+(r==="cat:"+c?' class="on"':'')+'>'+esc(c)+'</a>'}).join("")+'<a class="gap'+(r==="about"?' on':'')+'" href="#/about">About</a><a href="#/'+(ss("who")?"dashboard":"login")+'"'+(r==="staff"?' class="on"':'')+'>'+(ss("who")?"Dashboard":"Staff")+'</a>';
  var b=ST.banner,ban=b&&b.on&&b.text?'<div class="ban">'+(b.link?'<a href="'+esc(url(b.link))+'">'+esc(b.text)+'</a>':esc(b.text))+'</div>':'';
  var fn='<a href="#/">Home</a>'+S.categories.map(function(c){return '<a href="#/cat/'+encodeURIComponent(c)+'">'+esc(c)+'</a>'}).join("")+'<a href="#/about">About</a>';
  app.innerHTML=ban+'<header class="top"><div class="w bar"><a class="brand" href="#/">'+(S.logo?'<img src="'+esc(S.logo)+'" alt="">':'')+esc(S.name)+'</a><span class="tag">'+esc(S.tagline)+'</span></div><nav class="cats" aria-label="Sections"><div class="w">'+cats+'</div></nav></header><main class="w">'+html+'</main><footer><div class="w"><div class="fg"><div><b>'+esc(S.name)+'</b><p>'+esc(S.footer)+'</p></div><div><h4>Navigation</h4>'+fn+'</div>'+((DC()||(ST.links||[]).length)?'<div><h4>Connect</h4>'+(DC()?'<a href="'+esc(url(DC()))+'" target="_blank" rel="noopener noreferrer">Discord</a>':'')+(ST.links||[]).map(function(l){return '<a href="'+esc(url(l.url))+'" target="_blank" rel="noopener noreferrer">'+esc(l.label)+'</a>'}).join("")+'</div>':'')+'</div><p class="leg">'+esc(S.legal)+'</p></div></footer>';
  window.scrollTo(0,0);
}
function home(cat){
  var l=cat?A.filter(function(a){return a.category===cat}):A,r=cat?"cat:"+cat:"";
  if(!l.length)return shell('<h1>'+esc(cat||"Latest")+'</h1><p class="mut">No stories here yet.</p>'+disc(),r);
  var a=l.filter(function(x){return x.top})[0]||l[0],o=l.filter(function(x){return x!==a}),side=o.slice(0,4),rest=o.slice(4);
  shell((cat?'<h1>'+esc(cat)+'</h1>':'')+'<div class="hero"><a class="lead" href="#/a/'+esc(a.id)+'">'+im(a)+'<span class="cat" style="display:block;margin-top:.8rem">'+esc(a.category)+tag(a)+'</span><h2>'+esc(a.title)+'</h2><p>'+esc(a.summary)+'</p>'+meta(a)+'</a>'+(side.length?'<div class="side">'+side.map(function(s){return '<a href="#/a/'+esc(s.id)+'"><span class="cat">'+esc(s.category)+'</span><h3>'+esc(s.title)+'</h3>'+meta(s)+'</a>'}).join("")+'</div>':'')+'</div>'+(rest.length?'<h2 class="sh">More stories</h2><div class="grid">'+rest.map(card).join("")+'</div>':'')+disc(),r);
}
function article(id){
  var a=A.filter(function(x){return x.id===id})[0];
  if(!a)return shell('<p>Story not found. <a href="#/">Back to home</a></p>',"");
  shell('<article class="art"><p><a class="mut" href="#/">Back to home</a></p><span class="cat">'+esc(a.category)+tag(a)+'</span><h1>'+esc(a.title)+'</h1>'+(a.summary?'<p class="sum">'+esc(a.summary)+'</p>':'')+meta(a)+(a.image?im(a):'')+md(a.body)+'</article>'+(DC()?'<div class="enj"><h3>Enjoyed this article?</h3><p>Join our Discord to discuss and connect with other readers.</p><a class="btn" href="'+esc(DC())+'" target="_blank" rel="noopener noreferrer">Join Discord</a></div>':''),"");
}
function about(){
  shell('<h1>About</h1><div class="art" style="margin:0">'+md(ST.about||S.about)+'</div>'+(S.parent?'<aside class="disc"><div><h3>'+esc(S.parent.title)+'</h3><p>'+esc(S.parent.text)+'</p></div>'+(S.parent.link?'<a class="btn" href="'+esc(S.parent.link)+'" target="_blank" rel="noopener noreferrer">'+esc(S.parent.label||"Visit")+'</a>':'')+'</aside>':'')+'<h2 class="sh">'+esc(S.teamTitle||"The team")+'</h2><div class="team" id="tm"><p class="mut">Loading team...</p></div>'+disc(),"about");
  team().then(function(l){var e=$("tm");if(e)e.innerHTML=l.map(function(m){return '<div class="mem">'+(m.img?'<img src="'+esc(m.img)+'" alt="">':'<div class="ph">'+esc(m.name.charAt(0).toUpperCase())+'</div>')+'<b>'+esc(m.name)+'</b><span>'+esc(m.position)+'</span></div>'}).join("")});
}
function login(){
  if(ss("who"))return go("#/dashboard");
  shell('<h1>Staff login</h1><form class="box" id="lf"><label for="u">Roblox username</label><input id="u" autocomplete="username" required><label for="p">Password</label><input id="p" type="password" autocomplete="current-password" required><p><button>Log in</button></p><p class="err" id="m"></p></form>',"staff");
  $("lf").onsubmit=function(e){e.preventDefault();var u=$("u").value.trim().toLowerCase();$("m").textContent="";
    Promise.all([team(),sha($("p").value)]).then(function(r){var m=r[0].filter(function(x){return x.name.toLowerCase()===u&&x.hash===r[1]})[0];if(m){ss("who",m.name);ss("pos",m.position);ss("adm",m.admin?"1":"");go("#/dashboard")}else $("m").textContent="Wrong username or password."})};
}
function go(h){if(location.hash===h)route();else location.hash=h}
function gate(next){
  shell('<h1>Connect to GitHub</h1><form class="box" id="gf"><p>Enter your GitHub token to publish and edit stories. It stays in this browser tab only and is cleared when you log out.</p><label for="k">GitHub token</label><input id="k" type="password" autocomplete="off" required><p><button>Continue</button></p><p id="m" class="mut"></p></form>',"staff");
  $("gf").onsubmit=function(e){e.preventDefault();var t=$("k").value.trim(),m=$("m");m.className="mut";m.textContent="Checking token...";
    fetch("https://api.github.com/repos/"+O.owner+"/"+O.name,{headers:{Authorization:"Bearer "+t,Accept:"application/vnd.github+json"}}).then(function(r){if(r.status===401)throw new Error("That token isn't valid.");if(!r.ok)throw new Error("Couldn't reach the repo ("+r.status+"). Check owner and name in config.js and the token's repository access.");return r.json()}).then(function(j){if(j.permissions&&j.permissions.push===false)throw new Error("This token can't write to the repo. It needs Contents read and write.");ss(T,t);go(next)}).catch(function(x){m.className="err";m.textContent=x.message})};
}
function dash(){
  if(!ss("who"))return go("#/login");
  if(!tok())return gate("#/dashboard");
  shell('<h1>Dashboard</h1><p>Signed in as '+esc(ss("who"))+' ('+esc(ss("pos")||"Staff")+'). <a href="#/dashboard" id="lo" style="text-decoration:underline">Log out</a> <a href="#/dashboard" id="ct" style="text-decoration:underline;margin-left:.6rem">Change token</a></p>'+
   '<p class="btns"><button id="nw">New story</button><button class="g" id="rb">Rebuild share links</button></p><p class="mut">To get an automatic Discord preview, paste the story\'s Copy link URL (it looks like /p/story-id/).</p><p id="m"></p>'+
   '<div class="box" style="max-width:none">'+(A.length?A.map(function(a){return '<div class="dr"><div class="t">'+esc(a.title)+(a.top?' <small>(top story)</small>':'')+'<br><small style="font:400 .9rem var(--sans)">'+esc(a.category)+', '+esc(fmt(a.date))+'</small></div><div class="btns"><button class="g" data-cp="'+esc(a.id)+'">Copy link</button><button data-ed="'+esc(a.id)+'">Edit</button><button class="dng" data-dl="'+esc(a.id)+'">Delete</button></div></div>'}).join(""):'<p class="mut">No stories yet.</p>')+'</div>'+
   '<h2 class="sh">Site settings</h2><form class="box" id="sf"><label class="ck"><input type="checkbox" id="bo"'+(ST.banner.on?' checked':'')+'>Show banner on every page</label><label for="bt">Banner text</label><input id="bt" value="'+esc(ST.banner.text)+'"><label for="bl">Banner link (optional)</label><input id="bl" value="'+esc(ST.banner.link)+'"><label for="ab">About page text</label><textarea id="ab">'+esc(ST.about||S.about)+'</textarea><p><button>Save settings</button></p></form><h2 class="sh">Links</h2><form class="box" id="lkf"><label for="dc" style="margin-top:0">Discord invite link</label><input id="dc" type="url" value="'+esc(DC())+'"><label for="xl">Extra footer links (one per line: Label | https://link)</label><textarea id="xl" style="min-height:6rem">'+esc((ST.links||[]).map(function(l){return l.label+" | "+l.url}).join("\n"))+'</textarea><p><button>Save links</button></p></form>'+(ss("adm")?'<h2 class="sh">Accounts</h2><div class="box" style="max-width:none" id="ac"><p class="mut">Loading accounts...</p></div><form class="box" id="af" style="margin-top:1rem"><label for="ni" style="margin-top:0">New account: Roblox user ID</label><input id="ni" inputmode="numeric"><label for="np">Position</label><input id="np" value="Staff"><label for="nw2">Password (10+ characters)</label><input id="nw2" type="password" autocomplete="new-password"><label class="ck"><input type="checkbox" id="na">Can manage accounts</label><p><button>Add account</button></p></form>':''),"staff");
  var m=$("m"),say=function(t,c){m.className=c||"mut";m.textContent=t},tk=function(){var t=tok();if(!t){go("#/dashboard");return null}return t};
  $("lo").onclick=function(e){e.preventDefault();ss("who",null);ss("adm",null);ss(T,null);go("#/dashboard")};
  $("ct").onclick=function(e){e.preventDefault();ss(T,null);go("#/dashboard")};
  $("nw").onclick=function(){go("#/edit/new")};
  document.querySelectorAll("[data-ed]").forEach(function(b){b.onclick=function(){go("#/edit/"+b.dataset.ed)}});
  document.querySelectorAll("[data-cp]").forEach(function(b){b.onclick=function(){var l=SITE+"p/"+b.dataset.cp+"/";(navigator.clipboard?navigator.clipboard.writeText(l):Promise.reject()).then(function(){say("Link copied: "+l,"ok")}).catch(function(){prompt("Copy this link:",l)})}});
  document.querySelectorAll("[data-dl]").forEach(function(b){b.onclick=function(){var t=tk();if(!t||!confirm("Delete this story for everyone?"))return;var id=b.dataset.dl;say("Deleting...");
    save("articles.json",t,function(l){return l.filter(function(x){return x.id!==id})},"Delete story "+id,[]).then(function(){return dfile("p/"+id+"/index.html","Delete share page",t)}).then(function(){A=A.filter(function(x){return x.id!==id});dash()}).catch(function(e){say(e.message,"err")})}});
  $("rb").onclick=function(){var t=tk();if(!t)return;var i=0;(function nx(){if(i>=A.length)return say("Share links rebuilt for "+A.length+" stories.","ok");say("Rebuilding "+(i+1)+" of "+A.length+"...");saveShare(A[i++],t).then(nx).catch(function(e){say(e.message,"err")})})()};
  $("sf").onsubmit=function(e){e.preventDefault();say("Saving...");var n={banner:{on:$("bo").checked,text:$("bt").value.trim(),link:$("bl").value.trim()},about:$("ab").value};
    saveST(function(){return n},"Update settings").then(function(){FL="Settings saved.";dash()}).catch(function(x){say(x.message,"err")})};
  $("lkf").onsubmit=function(e){e.preventDefault();var d=$("dc").value.trim(),ls=[],bad=false;
    $("xl").value.split("\n").forEach(function(x){x=x.trim();if(!x)return;var q=x.split("|"),lb=(q[0]||"").trim(),u=(q[1]||"").trim();if(!lb||!/^https?:\/\//.test(u))bad=true;else ls.push({label:lb,url:u})});
    if(d&&!/^https?:\/\//.test(d))return say("The Discord link must start with https://","err");
    if(bad)return say("Each extra link needs a label and a link starting with https://, like: Rules | https://example.com","err");
    say("Saving...");saveST(function(){return{discord:d,links:ls}},"Update links").then(function(){FL="Links saved.";dash()}).catch(function(x){say(x.message,"err")})};
  if(ss("adm")){
    team().then(function(l){var el=$("ac");if(!el)return;
      el.innerHTML=l.map(function(a){var own=a.src!=="config";return '<div class="dr"><div class="t">'+esc(a.name)+' <small>(ID '+esc(a.id)+')</small><br><small style="font:400 .9rem var(--sans)">'+esc(a.position)+(a.admin?', can manage accounts':'')+(own?'':', set in config.js')+'</small></div><div class="btns">'+(own?'<button class="g" data-pw="'+esc(a.id)+'">Reset password</button>'+(a.name===ss("who")?'':'<button class="dng" data-rm="'+esc(a.id)+'">Remove</button>'):'')+'</div></div>'}).join("");
      el.querySelectorAll("[data-pw]").forEach(function(b){b.onclick=function(){var pw=prompt("New password (10+ characters):");if(!pw)return;if(pw.length<10)return say("Use a password of 10 or more characters.","err");
        sha(pw).then(function(h){return saveST(function(cur){return{accounts:(cur.accounts||[]).map(function(a){return String(a.id)===b.dataset.pw?Object.assign({},a,{passwordHash:h}):a})}},"Reset password")}).then(function(){FL="Password reset.";dash()}).catch(function(x){say(x.message,"err")})}});
      el.querySelectorAll("[data-rm]").forEach(function(b){b.onclick=function(){if(!confirm("Remove this account?"))return;
        saveST(function(cur){return{accounts:(cur.accounts||[]).filter(function(a){return String(a.id)!==b.dataset.rm})}},"Remove account").then(function(){FL="Account removed.";dash()}).catch(function(x){say(x.message,"err")})}});
    });
    $("af").onsubmit=function(e){e.preventDefault();var id=+$("ni").value.trim(),pos=$("np").value.trim()||"Staff",pw=$("nw2").value,adm=$("na").checked;
      if(!id||id<1)return say("Enter a numeric Roblox user ID.","err");
      if(pw.length<10)return say("Use a password of 10 or more characters.","err");
      team().then(function(l){if(l.some(function(x){return x.id===id}))throw new Error("That ID already has an account.")}).then(function(){return sha(pw)}).then(function(h){say("Adding...");return saveST(function(cur){return{accounts:(cur.accounts||[]).concat([{id:id,position:pos,passwordHash:h,admin:adm}])}},"Add account "+id)}).then(function(){FL="Account added. They also need their own GitHub token to publish.";dash()}).catch(function(x){say(x.message,"err")})};
  }
  if(FL){say(FL,"ok");FL=""}
}
function edit(id){
  if(!ss("who"))return go("#/login");
  if(!tok())return gate("#/edit/"+id);
  var old=id==="new"?null:A.filter(function(x){return x.id===id})[0];
  if(id!=="new"&&!old)return shell('<p>Story not found. <a href="#/dashboard">Back to dashboard</a></p>',"staff");
  var a=old||{title:"",summary:"",category:S.categories[0],tag:"",date:nowLocal(),author:ss("who"),image:"",top:false,body:""};
  var au=[a.author];if(au.indexOf(ss("who"))<0)au.push(ss("who"));
  var opt=function(l,s){return l.map(function(c){return '<option'+(c===s?' selected':'')+'>'+esc(c)+'</option>'}).join("")};
  shell('<form class="box" id="wf" style="max-width:48rem"><h1>'+(old?"Edit story":"New story")+'</h1><label for="t">Title</label><input id="t" value="'+esc(a.title)+'"><label for="s">Summary (one line, optional)</label><input id="s" value="'+esc(a.summary)+'"><label for="c">Category</label><select id="c">'+opt(S.categories,a.category)+'</select><label for="g">Tag (optional, e.g. a country; shown in the Discord preview)</label><input id="g" value="'+esc(a.tag)+'"><label for="d">Date and time</label><input id="d" type="datetime-local" value="'+esc(String(a.date).slice(0,16))+'"><label for="au">Author</label><select id="au">'+opt(au,a.author)+'</select><label for="i">Cover image (URL or upload)</label><input id="i" value="'+esc(a.image)+'"><input id="f" type="file" accept="image/*" style="margin-top:.4rem"><label class="ck"><input type="checkbox" id="top"'+(a.top?' checked':'')+'>Top story (large banner on Home)</label><label for="b">Story</label><div class="tb" id="tb"><button type="button" data-k="h1">H1</button><button type="button" data-k="h2">H2</button><button type="button" data-k="h3">H3</button><button type="button" data-k="h4">H4</button><button type="button" data-k="b">Bold</button><button type="button" data-k="i">Italic</button><button type="button" data-k="l">Link</button><button type="button" data-k="m">Image</button><button type="button" data-k="s">Separator</button></div><textarea id="b">'+esc(a.body)+'</textarea><div class="pv art" id="pv"></div><p class="btns"><button>Publish</button><button type="button" class="g" id="cn">Cancel</button></p><p id="m"></p></form>',"staff");
  var ta=$("b"),m=$("m"),say=function(t,c){m.className=c||"mut";m.textContent=t},pv=function(){$("pv").innerHTML=md(ta.value)};pv();ta.oninput=pv;
  team().then(function(l){var s=$("au");if(!s)return;l.forEach(function(x){if(au.indexOf(x.name)<0&&x.name!==ss("who")){var o=document.createElement("option");o.textContent=x.name;s.appendChild(o)}})});
  $("cn").onclick=function(){go("#/dashboard")};
  $("tb").onclick=function(e){var k=e.target.dataset.k;if(!k)return;var s=ta.selectionStart,n=ta.selectionEnd,sel=ta.value.slice(s,n),r;
    if(/^h\d$/.test(k))r="\n\n"+"#".repeat(+k[1])+" "+(sel||"Heading")+"\n\n";else if(k==="b")r="**"+(sel||"bold")+"**";else if(k==="i")r="*"+(sel||"italic")+"*";else if(k==="l")r="["+(sel||"link text")+"](https://)";else if(k==="m")r="![description]("+(sel||"https://")+")";else r="\n\n---\n\n";
    ta.value=ta.value.slice(0,s)+r+ta.value.slice(n);ta.focus();pv()};
  $("f").onchange=function(){var f=this.files[0],t=tok();if(!f)return;if(!t)return say("Your GitHub token is missing. Go to the dashboard and enter it again.","err");
    var p="images/"+Date.now()+"-"+f.name.replace(/[^a-z0-9.]+/gi,"-"),r=new FileReader();say("Uploading image...");
    r.onload=function(){wfile(p,r.result.split(",")[1],"Upload image",t).then(function(){$("i").value=p;say("Image uploaded.","ok")}).catch(function(x){say(x.message,"err")})};r.readAsDataURL(f)};
  $("wf").onsubmit=function(e){e.preventDefault();var t=tok(),ti=$("t").value.trim(),bd=ta.value.trim();
    if(!t)return say("Add your GitHub token on the dashboard first.","err");
    if(!ti||!bd)return say("Add a title and a story first.","err");
    var art={id:old?old.id:ti.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)+"-"+Date.now().toString(36),title:ti,summary:$("s").value.trim(),category:$("c").value,tag:$("g").value.trim(),date:$("d").value||nowLocal(),author:$("au").value,image:$("i").value.trim(),top:$("top").checked,body:bd};
    say("Publishing...");
    save("articles.json",t,function(l){if(old)l=l.map(function(x){return x.id===old.id?art:x});else l.unshift(art);if(art.top)l.forEach(function(x){if(x.id!==art.id)x.top=false});return l},"Save story: "+ti,[]).then(function(){return saveShare(art,t)}).then(function(){
      if(art.top)A.forEach(function(x){x.top=false});A=A.filter(function(x){return x.id!==art.id});A.push(art);sortA();go("#/dashboard")}).catch(function(x){say(x.message,"err")})};
}
function hash(){
  shell('<h1>Password hash</h1><form class="box" id="hf"><label for="p">Password</label><input id="p"><p><button>Make hash</button></p><p id="o" style="word-break:break-all"></p></form>',"");
  $("hf").onsubmit=function(e){e.preventDefault();sha($("p").value).then(function(h){$("o").textContent=h})};
}
function sortA(){A.sort(function(a,b){return String(b.date).localeCompare(String(a.date))})}
function route(){
  var h=location.hash.replace(/^#\/?/,"").split("/"),r=h[0];document.title=S.name;
  if(r==="a")article(h[1]);else if(r==="cat")home(decodeURIComponent(h[1]||""));else if(r==="about")about();else if(r==="login"||r==="write")login();else if(r==="dashboard")dash();else if(r==="edit")edit(h[1]);else if(r==="hash")hash();else home();
}
window.addEventListener("hashchange",route);
var jf=function(f,d){return fetch(f+"?"+Date.now()).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return d})};
Promise.all([jf("articles.json",[]),jf("settings.json",null)]).then(function(r){A=r[0];sortA();if(r[1])ST=Object.assign({},ST,r[1],{banner:r[1].banner||ST.banner});route()});
})();

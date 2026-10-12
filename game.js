(() => {
const $ = id => document.getElementById(id);
const screens = [...document.querySelectorAll(".screen")];
const state = { screen:"menu", mode:"ai", goals:5, difficulty:"normal", speed:1, controls:"touch", running:false, paused:false, countdown:false, last:0 };
const input = { p1l:0,p1r:0,p1j:0,p1k:0,p2l:0,p2r:0,p2j:0,p2k:0 };
const world = { w:960,h:560,ground:485,goalTop:330 };
const canvas=$("gameCanvas"), ctx=canvas.getContext("2d"), stage=$("stage");
let p1,p2,ball,raf;
function show(n){state.screen=n;screens.forEach(s=>s.classList.remove("active"));$(n==="menu"?"menuScreen":n==="settings"?"settingsScreen":n==="controls"?"controlsScreen":"gameScreen").classList.add("active")}
function reset(keep=false){
 const a=keep&&p1?p1.score:0,b=keep&&p2?p2.score:0;
 p1={x:250,y:441,vx:0,vy:0,r:44,score:a,color:"#69e3ad",facing:1,onGround:true,power:0};
 p2={x:710,y:441,vx:0,vy:0,r:44,score:b,color:"#ffd166",facing:-1,onGround:true,power:0};
 ball={x:480,y:280,vx:0,vy:0,r:20};updateScore();
}
function updateScore(){$("p1Score").textContent=p1.score;$("p2Score").textContent=p2.score}
function controlsVisible(){$("touchControls").style.display=state.controls==="touch"?"grid":"none";$("p2Pad").style.display=state.mode==="local"?"block":"none"}
function setPower(p,v){p.power=Math.max(0,Math.min(1,v));$("p"+(p===p1?1:2)+"Power").style.width=p.power*100+"%";$("p"+(p===p1?1:2)+"PowerText").textContent=Math.round(p.power*100)+"%"}
function countdown(prefix,done){
 const arr=prefix?[prefix,"3","2","1","GO!"]:["3","2","1","GO!"];let i=0;$("countdown").textContent=arr[0];
 const timer=setInterval(()=>{i++;if(i>=arr.length){clearInterval(timer);$("countdown").textContent="";done()}else $("countdown").textContent=arr[i]},prefix?620:560);
}
function start(){state.running=true;state.paused=false;state.countdown=true;reset(false);show("game");controlsVisible();$("pauseBtn").textContent="Pause";countdown("KICK OFF",()=>{state.countdown=false;stage.focus()});state.last=performance.now();raf=requestAnimationFrame(loop)}
function goal(n){
 if(state.countdown)return;
 if(n===1)p1.score++;else p2.score++;updateScore();
 if(p1.score>=state.goals)return finish(1);if(p2.score>=state.goals)return finish(2);
 state.countdown=true;$("message").textContent="GOAL!";
 setTimeout(()=>{$("message").textContent="";reset(true);countdown("",()=>state.countdown=false)},750);
}
function finish(n){state.running=false;$("message").textContent=n===1?"PLAYER 1 WINS!":state.mode==="ai"?"AI WINS!":"PLAYER 2 WINS!";setTimeout(()=>{$("message").textContent="";show("menu")},2200)}
function kickBall(p){
 const dx=ball.x-p.x;
 if(Math.abs(dx)>120||Math.sign(dx)!==p.facing)return;
 const relative=(p.y-ball.y)/(p.r*1.55),chip=Math.max(0,Math.min(1,relative)),power=.25+.75*p.power;
 ball.vx=p.facing*520*power*(.8+.2*(1-chip))+p.vx*.45;
 ball.vy=-(80+390*chip)*power+p.vy*.15;
 ball.x=p.x+p.facing*(p.r+ball.r+2);
}
function move(p,l,r,j,k,dt){
 const acc=1150,max=320;
 if(l){p.vx-=acc*dt;p.facing=-1}if(r){p.vx+=acc*dt;p.facing=1}
 if(!l&&!r)p.vx*=Math.pow(.002,dt);
 p.vx=Math.max(-max,Math.min(max,p.vx));
 if(j&&p.onGround){p.vy=-550;p.onGround=false}
 p.vy+=1260*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
 if(p.y+p.r>=world.ground){p.y=world.ground-p.r;p.vy=0;p.onGround=true}
 p.x=Math.max(58,Math.min(world.w-58,p.x));
 if(k)p.power=Math.min(1,p.power+dt*1.35);else if(p.power>.04){kickBall(p);p.power=0}
 setPower(p,p.power);
}
function ai(){
 const d={easy:.75,normal:.92,hard:1.08}[state.difficulty],target=ball.x+ball.vx*.2;
 input.p2l=target<p2.x-18;input.p2r=target>p2.x+18;
 input.p2j=ball.y<p2.y-42&&Math.abs(ball.x-p2.x)<145&&Math.random()<.012*d;
 input.p2k=Math.abs(ball.x-p2.x)<105&&Math.sign(ball.x-p2.x)===p2.facing?1:0;
}
function collide(p){
 const dx=ball.x-p.x,dy=ball.y-p.y,d=Math.hypot(dx,dy),m=p.r+ball.r;
 if(d<m&&d>0){const nx=dx/d,ny=dy/d,over=m-d;ball.x+=nx*over;ball.y+=ny*over;ball.vx+=nx*230+p.vx*.7;ball.vy+=ny*180}
}
function update(dt){
 if(!state.running||state.paused||state.countdown)return;
 dt*=state.speed;if(state.mode==="ai")ai();
 move(p1,input.p1l,input.p1r,input.p1j,input.p1k,dt);
 move(p2,input.p2l,input.p2r,input.p2j,input.p2k,dt);
 ball.vy+=1050*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.vx*=Math.pow(.64,dt);ball.vy*=Math.pow(.92,dt);
 if(ball.y+ball.r>world.ground){ball.y=world.ground-ball.r;ball.vy*=-.68;if(Math.abs(ball.vy)<40)ball.vy=0}
 if(ball.y-ball.r<115){ball.y=115+ball.r;ball.vy=Math.abs(ball.vy)*.7}
 collide(p1);collide(p2);
 if(ball.x-ball.r<0&&ball.y<world.goalTop){ball.x=ball.r;ball.vx=Math.abs(ball.vx)*.75}
 if(ball.x+ball.r>world.w&&ball.y<world.goalTop){ball.x=world.w-ball.r;ball.vx=-Math.abs(ball.vx)*.75}
 if(ball.x<-10&&ball.y>world.goalTop)goal(2);
 if(ball.x>world.w+10&&ball.y>world.goalTop)goal(1);
}
function stadium(){
 const g=ctx.createLinearGradient(0,0,0,560);g.addColorStop(0,"#1a2c4a");g.addColorStop(.38,"#304968");g.addColorStop(.39,"#0b704d");g.addColorStop(1,"#0b8f59");ctx.fillStyle=g;ctx.fillRect(0,0,960,560);
 ctx.fillStyle="#0b1322";ctx.fillRect(0,0,960,70);
 for(const x of [95,865]){ctx.fillStyle="#26344b";ctx.fillRect(x-8,45,16,130);const gl=ctx.createRadialGradient(x,55,2,x,55,115);gl.addColorStop(0,"#fff6ca55");gl.addColorStop(1,"#fff6ca00");ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,55,115,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle="#344660";ctx.fillRect(0,70,960,150);
 const colors=["#f2c66d","#8bd3ff","#ff8e8e","#d8b4ff","#94e0aa","#fff"];
 for(let r=0;r<5;r++)for(let x=14;x<960;x+=24){ctx.fillStyle=colors[(Math.floor(x/24)+r*2)%colors.length];ctx.beginPath();ctx.arc(x+(r%2?8:0),92+r*25,4,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle="#0005";ctx.fillRect(0,215,960,20);
}
function pitch(){
 for(let i=0;i<10;i++){ctx.fillStyle=i%2?"#159a61":"#118d59";ctx.fillRect(i*96,225,96,290)}
 ctx.strokeStyle="#fffc";ctx.lineWidth=4;ctx.strokeRect(28,247,904,238);ctx.beginPath();ctx.moveTo(480,247);ctx.lineTo(480,485);ctx.stroke();ctx.beginPath();ctx.arc(480,365,72,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle="#076c45";ctx.fillRect(0,485,960,75);
}
function goalDraw(left){
 const fx=left?4:956,bx=left?-68:1028,top=world.goalTop,bot=world.ground;
 ctx.strokeStyle="#f2f6fa";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(fx,top);ctx.lineTo(fx,bot);ctx.moveTo(fx,top);ctx.lineTo(bx,top+24);ctx.moveTo(fx,bot);ctx.lineTo(bx,bot-6);ctx.stroke();
 ctx.lineWidth=1.5;ctx.strokeStyle="#fff6";
 for(let i=1;i<6;i++){const t=i/6,x=fx+(bx-fx)*t;ctx.beginPath();ctx.moveTo(x,top+24*t);ctx.lineTo(x,bot-6*t);ctx.stroke()}
 for(let i=1;i<6;i++){const t=i/6;ctx.beginPath();ctx.moveTo(fx,top+(bot-top)*t);ctx.lineTo(bx,top+24+(bot-top-30)*t);ctx.stroke()}
}
function pin(p){
 ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle="#0005";ctx.beginPath();ctx.ellipse(0,p.r+12,38,11,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#eaf3fa";ctx.beginPath();ctx.roundRect(-15,29,30,38,12);ctx.fill();
 ctx.beginPath();ctx.moveTo(-15,57);ctx.lineTo(-30,75);ctx.lineTo(30,75);ctx.lineTo(15,57);ctx.closePath();ctx.fill();ctx.strokeStyle="#d8e3ed";ctx.lineWidth=4;ctx.stroke();
 const g=ctx.createRadialGradient(-15,-18,4,0,0,p.r);g.addColorStop(0,"#fff");g.addColorStop(.18,p.color);g.addColorStop(1,p.color);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fffd";ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle="#142033";ctx.beginPath();ctx.ellipse(-14,-7,5,8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(14,-7,5,8,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#142033";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,5,16,.2,Math.PI-.2);ctx.stroke();ctx.restore();
}
function ballDraw(){
 ctx.fillStyle="#0004";ctx.beginPath();ctx.ellipse(ball.x+5,492,24,8,0,0,Math.PI*2);ctx.fill();
 const g=ctx.createRadialGradient(ball.x-7,ball.y-8,3,ball.x,ball.y,ball.r);g.addColorStop(0,"#fff");g.addColorStop(1,"#d8e2ec");ctx.fillStyle=g;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#39485a";ctx.lineWidth=2;ctx.stroke();
}
function draw(){
 ctx.clearRect(0,0,960,560);stadium();pitch();goalDraw(true);goalDraw(false);pin(p1);pin(p2);ballDraw();
 if(state.paused){ctx.fillStyle="#04091299";ctx.fillRect(0,0,960,560);ctx.fillStyle="#fff";ctx.font="900 64px system-ui";ctx.textAlign="center";ctx.fillText("PAUSED",480,300)}
}
function loop(t){const dt=Math.min(.024,(t-state.last)/1000||0);state.last=t;update(dt);draw();if(state.screen==="game")raf=requestAnimationFrame(loop)}
const keyMap={KeyA:"p1l",KeyD:"p1r",KeyW:"p1j",KeyS:"p1k",ArrowLeft:"p2l",ArrowRight:"p2r",ArrowUp:"p2j",ArrowDown:"p2k"};
stage.addEventListener("keydown",e=>{if(state.controls!=="keyboard")return;const k=keyMap[e.code];if(k){e.preventDefault();input[k]=1}});
stage.addEventListener("keyup",e=>{if(state.controls!=="keyboard")return;const k=keyMap[e.code];if(k){e.preventDefault();input[k]=0}});
document.querySelectorAll("[data-input]").forEach(b=>{const k=b.dataset.input,on=e=>{e.preventDefault();input[k]=1},off=e=>{e.preventDefault();input[k]=0};b.addEventListener("pointerdown",on);b.addEventListener("pointerup",off);b.addEventListener("pointercancel",off);b.addEventListener("pointerleave",off)});
$("playBtn").onclick=start;$("settingsBtn").onclick=()=>show("settings");$("controlsBtn").onclick=()=>show("controls");document.querySelectorAll(".backBtn").forEach(b=>b.onclick=()=>show("menu"));
$("menuBtn").onclick=()=>{state.running=false;cancelAnimationFrame(raf);show("menu")};$("pauseBtn").onclick=()=>{state.paused=!state.paused;$("pauseBtn").textContent=state.paused?"Resume":"Pause"};
$("modeSelect").onchange=e=>{state.mode=e.target.value;controlsVisible()};$("lengthSelect").onchange=e=>state.goals=+e.target.value;$("difficultySelect").onchange=e=>state.difficulty=e.target.value;$("speedSelect").onchange=e=>state.speed=+e.target.value;$("controlSelect").onchange=e=>{state.controls=e.target.value;controlsVisible()};
reset(false);draw();
})();
(()=>{
const $=id=>document.getElementById(id), canvas=$('field'),ctx=canvas.getContext('2d');
const teams={blue:{name:'SKY STRIKERS',color:'#27adff',dark:'#0865b8',trim:'#e8f7ff',hair:'#172a40',style:0},red:{name:'FIRE FLYERS',color:'#ff4e59',dark:'#b91e37',trim:'#fff2e9',hair:'#211a24',style:1},green:{name:'JUNGLE CREW',color:'#61e878',dark:'#168849',trim:'#eaffc4',hair:'#2a442c',style:2},purple:{name:'NIGHT NINJAS',color:'#ad70ff',dark:'#6023bd',trim:'#f5eaff',hair:'#27153c',style:3},gold:{name:'ROYAL RUSH',color:'#ffce3a',dark:'#c47a12',trim:'#fff7cf',hair:'#754018',style:4},ice:{name:'ICE BREAKERS',color:'#73f1ff',dark:'#1889c9',trim:'#fff',hair:'#a5f5ff',style:5},orange:{name:'HOT SHOTS',color:'#ff8b32',dark:'#c84c15',trim:'#fff0d2',hair:'#5d2815',style:1},pink:{name:'BUBBLE BLITZ',color:'#ff7fc7',dark:'#b52f82',trim:'#fff',hair:'#5a2446',style:2},teal:{name:'WAVE RIDERS',color:'#36d7d2',dark:'#087b91',trim:'#eaffff',hair:'#163e49',style:3},black:{name:'SHADOW SQUAD',color:'#343b4d',dark:'#111827',trim:'#a8c3db',hair:'#090d17',style:5}};
const maps={stadium:{name:'GRAND STADIUM',sky:['#49b8ff','#d5f6ff'],grass:'#159b57',stripe:'#21ad64',crowd:true},street:{name:'STREET COURT',sky:['#2d3c58','#f7a45c'],grass:'#287b79',stripe:'#33938c',city:true},indoor:{name:'INDOOR ARENA',sky:['#152a49','#466f94'],grass:'#147b69',stripe:'#209b82',indoor:true},beach:{name:'TROPICAL BEACH',sky:['#35bfff','#d9fcff'],grass:'#e8c27a',stripe:'#f1d596',beach:true},snow:{name:'SNOW FIELD',sky:['#87cfff','#f8ffff'],grass:'#d8f3ff',stripe:'#c4e8fa',snow:true},sunset:{name:'SUNSET CITY',sky:['#ff6c68','#ffc36b'],grass:'#246d58',stripe:'#318a65',city:true},space:{name:'COSMIC PITCH',sky:['#100f37','#37266e'],grass:'#174a59',stripe:'#1c6571',space:true},jungle:{name:'JUNGLE BOWL',sky:['#4cae83','#c9e69a'],grass:'#12633c',stripe:'#1c7947',jungle:true}};
let W=1200,H=650,dpr=1, mode='ai',difficulty='normal',goalLimit=5, map=maps.stadium, p1,p2,ball,score=[0,0],keys={},running=false,paused=false,charge={blue:0,red:0},last=0,goalPause=0, bannerTimer=2, raf=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cpuModes={easy:{response:.045,maxSpeed:4.3,deadzone:42,lead:.06,jumpRange:58,jumpChance:.18,kickRange:43,kickAhead:31},normal:{response:.055,maxSpeed:5.8,deadzone:25,lead:.14,jumpRange:82,jumpChance:.48,kickRange:60,kickAhead:42},hard:{response:.072,maxSpeed:7.3,deadzone:14,lead:.23,jumpRange:110,jumpChance:.78,kickRange:77,kickAhead:52}};
function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=Math.max(640,r.width);H=Math.max(340,r.height);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
function newPlayer(x,team,side){return{x,y:H*.81,vx:0,vy:0,r:Math.min(32,H*.057),team,side,ground:true,face:side===0?1:-1,score:0,run:0,jump:0,kickCooldown:0,dashCooldown:0,dashTime:0,lastTap:{},dashDir:0}}
function reset(keep=false){if(!keep)score=[0,0];p1=newPlayer(W*.23,teams[$('bluePick').value],0);p2=newPlayer(W*.77,teams[$('redPick').value],1);ball={x:W/2,y:H*.46,vx:(Math.random()>.5?1:-1)*1.2,vy:-1.5,r:Math.max(12,H*.023),spin:0};updateScore();if(!keep){goalPause=1.5;bannerTimer=1.5;$('banner').textContent='GET READY!';}}
function updateScore(){$('score').textContent=score[0]+' — '+score[1];$('blueName').textContent=p1?.team.name||'BLUE';$('redName').textContent=p2?.team.name||'RED'}
function start(){mode=$('mode').value;difficulty=$('difficultyPick').value||'normal';goalLimit=+$('goalPick').value;map=maps[$('mapPick').value];score=[0,0];p1=newPlayer(W*.23,teams[$('bluePick').value],0);p2=newPlayer(W*.77,teams[$('redPick').value],1);$('menu').classList.add('hidden');$('game').classList.remove('hidden');$('mapLabel').textContent=map.name;$('status').textContent=mode==='ai'?'VS CPU':'LOCAL 2 PLAYER';resize();reset();running=true;paused=false;$('pause').textContent='Ⅱ PAUSE';cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop)}
function back(){running=false;cancelAnimationFrame(raf);$('game').classList.add('hidden');$('menu').classList.remove('hidden')}
function kick(p,power){const hx=p.x,hy=p.y-p.r*1.55,dx=ball.x-hx,dy=ball.y-hy,dist=Math.hypot(dx,dy);if(dist<p.r*1.8+ball.r+35){const dir=p.side===0?1:-1;const strength=6.5+power*8.8;ball.vx+=dir*strength+p.vx*.5;ball.vy-=3.3+power*4.4+(dy<0?1.5:0);ball.spin+=dir*power*7;ball.vy=Math.min(ball.vy,-2.5);ball.vx=clamp(ball.vx,-14.5,14.5);ball.vy=clamp(ball.vy,-14,14);p.kickCooldown=.45}}
function collidePlayers(){let dx=p2.x-p1.x,dy=(p2.y-p2.r*1.55)-(p1.y-p1.r*1.55),d=Math.hypot(dx,dy),min=p1.r*1.45+p2.r*1.45;if(d<min){if(d<.001){dx=1;d=1}const nx=dx/d,ny=dy/d,over=min-d;p1.x-=nx*over*.5;p2.x+=nx*over*.5;p1.vx-=nx*1.1;p2.vx+=nx*1.1;if(ny<-.35&&p1.vy>1)p1.vy*=.7;if(ny>.35&&p2.vy>1)p2.vy*=.7}}
function playerBall(p,oldX=ball.x,oldY=ball.y){
 const px=p.x,py=p.y-p.r*1.55,min=p.r*.9+ball.r;
 const sx=ball.x-oldX,sy=ball.y-oldY,seg2=sx*sx+sy*sy;
 const t=seg2>1e-6?clamp(((px-oldX)*sx+(py-oldY)*sy)/seg2,0,1):0;
 const cx=oldX+sx*t,cy=oldY+sy*t;
 let nx=cx-px,ny=cy-py,d=Math.hypot(nx,ny);
 if(d>=min)return;
 if(d>1e-4){nx/=d;ny/=d}
 else{const speed=Math.hypot(sx,sy)||1;nx=-sx/speed;ny=-sy/speed}
 const endX=ball.x-px,endY=ball.y-py,endD=Math.hypot(endX,endY);
 if(endD>1e-4&&endD<min){nx=endX/endD;ny=endY/endD}
 ball.x=px+nx*min;ball.y=py+ny*min;
 const approach=(ball.vx-p.vx)*nx+(ball.vy-p.vy)*ny;
 if(approach<0){ball.vx-=1.9*approach*nx;ball.vy-=1.9*approach*ny;ball.vx+=p.vx*.18;ball.vy+=p.vy*.12}
 ball.vx=clamp(ball.vx,-15.5,15.5);ball.vy=clamp(ball.vy,-15,15)
}
function update(dt){if(goalPause>0){goalPause-=dt;if(goalPause<=0){$('banner').textContent='';bannerTimer=0}return}
const move=(p,left,right,jump,kickKey,ai=false)=>{let l=keys[left],r=keys[right],j=keys[jump],k=keys[kickKey];p.kickCooldown=Math.max(0,p.kickCooldown-dt);if(ai){const cfg=cpuModes[difficulty]||cpuModes.normal;const target=clamp(ball.x+ball.vx*cfg.lead,W*.47,W-p.r-14);l=p.x>target+cfg.deadzone;r=p.x<target-cfg.deadzone;j=ball.y<p.y-p.r*1.1&&Math.abs(ball.x-p.x)<cfg.jumpRange&&p.ground&&Math.random()<cfg.jumpChance;k=p.kickCooldown<=0&&Math.abs(ball.x-p.x)<cfg.kickRange&&Math.abs(ball.y-(p.y-p.r*1.55))<p.r+ball.r+18}
const ax=(r?1:0)-(l?1:0);p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.dashTime=Math.max(0,p.dashTime-dt);if(p.dashTime>0){p.vx=p.dashDir*15.5}else{p.vx+=ax*55*dt;p.vx*=Math.pow(p.ground?.84:.97,dt*60);p.vx=clamp(p.vx,-10.5,10.5)}if(ax)p.face=ax;if(j&&p.ground){p.vy=-10.7;p.ground=false}p.vy+=26*dt;p.x+=p.vx;p.y+=p.vy;p.y=clamp(p.y,H*.34,H*.81);if(p.y>=H*.81){p.y=H*.81;p.vy=0;p.ground=true}p.x=clamp(p.x,p.r+14,W-p.r-14);p.run+=Math.abs(p.vx)*dt*5;
if(k&&!p.kickHeld){p.kickHeld=true;charge[p.side?'red':'blue']=Math.max(charge[p.side?'red':'blue'],.15)}if(k){charge[p.side?'red':'blue']=Math.min(1,charge[p.side?'red':'blue']+dt*1.15)}else{p.kickHeld=false;if(charge[p.side?'red':'blue']>0){kick(p,charge[p.side?'red':'blue']);charge[p.side?'red':'blue']=0}}}
move(p1,'a','d','w','s');if(mode==='local')move(p2,'left','right','up','down');else move(p2,'left','right','up','down',true);
collidePlayers();const prevBallX=ball.x,prevBallY=ball.y;ball.vy+=23*dt;ball.x+=ball.vx;ball.y+=ball.vy;ball.vx*=Math.pow(.995,dt*60);ball.vy*=Math.pow(.998,dt*60);ball.vx=clamp(ball.vx,-14.5,14.5);ball.vy=clamp(ball.vy,-14,14);ball.spin+=ball.vx*dt;playerBall(p1,prevBallX,prevBallY);playerBall(p2,prevBallX,prevBallY);
const gy=H*.53,gh=H*.28,post=H*.016;
if(ball.y+ball.r>=H*.81){ball.y=H*.81-ball.r;if(ball.vy>1.0){ball.vy=-ball.vy*.90;ball.vx*=.985}else{ball.vy=0;ball.vx*=.99}}
if(ball.x<post+ball.r){ball.x=post+ball.r;ball.vx=Math.abs(ball.vx)*.88}
if(ball.x>W-post-ball.r){ball.x=W-post-ball.r;ball.vx=-Math.abs(ball.vx)*.88}
if(ball.y<post+ball.r){ball.y=post+ball.r;ball.vy=Math.abs(ball.vy)*.88}
for(const gx of [W*.045,W*.955]){const left=gx<W/2,inside=left?ball.x<gx+W*.045:ball.x>gx-W*.045;if(inside&&ball.y>gy&&ball.y<gy+gh){if((left&&ball.x<gx)||( !left&&ball.x>gx)){score[left?1:0]++;updateScore();$('banner').textContent=score[left?1:0]>=goalLimit?'MATCH WON!':'GOAL!';$('status').textContent=score[left?1:0]>=goalLimit?'WINNER!':'GOAL SCORED';if(score[left?1:0]>=goalLimit){goalPause=3;$('banner').textContent=(left?p2.team.name:p1.team.name)+' WINS!';score=[0,0]}else goalPause=1.8;reset(true);return}}}
if(Math.abs(ball.vx)<.08&&Math.abs(ball.vy)<.08){ball.vx+=(Math.random()-.5)*.4;ball.vy=-.4}}
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function drawBackground(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,map.sky[0]);g.addColorStop(1,map.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
if(map.space){for(let i=0;i<65;i++){const x=(i*197)%W,y=(i*83)%(H*.48);ctx.fillStyle=i%3?'#ffffffbb':'#7ceaff';ctx.fillRect(x,y,2,2)}for(let i=0;i<3;i++){const x=W*(.2+i*.3),y=H*(.15+(i%2)*.13);const rg=ctx.createRadialGradient(x-8,y-8,2,x,y,22);rg.addColorStop(0,['#ffb0d0','#72f5ff','#a992ff'][i]);rg.addColorStop(1,'#342e80');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,20+i*4,0,7);ctx.fill()}}
else if(map.city||map.indoor){for(let i=0;i<22;i++){const bw=W/19,bh=H*(.08+(i*37%100)/230);ctx.fillStyle=map.indoor?'#17283d':'#293e53';ctx.fillRect(i*bw,H*.4-bh,bw-3,bh);for(let j=0;j<5;j++)for(let k=0;k<3;k++){ctx.fillStyle=map.indoor?'#6e9dbb':'#f6c879';ctx.globalAlpha=.25;ctx.fillRect(i*bw+5+j*7,H*.4-bh+6+k*9,3,4);ctx.globalAlpha=1}}}
else if(map.beach){ctx.fillStyle='#56c8e9';ctx.fillRect(0,H*.3,W,H*.12);for(let x=35;x<W;x+=W/6){ctx.strokeStyle='#5a6b35';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,H*.4);ctx.lineTo(x-8,H*.18);ctx.stroke();ctx.fillStyle='#167e50';ctx.beginPath();ctx.ellipse(x-25,H*.19,32,7,-.5,0,7);ctx.ellipse(x+18,H*.17,31,7,.4,0,7);ctx.fill()}}
else if(map.jungle){for(let i=0;i<Math.ceil(W/92)+1;i++){const x=i*92+(i%2)*24,ty=H*(.20+(i%3)*.035),sc=.78+(i%4)*.1;ctx.fillStyle='#5b4733';ctx.beginPath();ctx.moveTo(x-5*sc,H*.405);ctx.lineTo(x+5*sc,H*.405);ctx.lineTo(x+3*sc,ty+12*sc);ctx.lineTo(x-2*sc,ty+12*sc);ctx.closePath();ctx.fill();for(let layer=0;layer<3;layer++){const yy=ty+layer*17*sc;ctx.fillStyle=['#0c5236','#146a42','#1d7b4a'][layer];ctx.beginPath();ctx.moveTo(x,yy-26*sc);ctx.lineTo(x+28*sc,yy+3*sc);ctx.lineTo(x+15*sc,yy+5*sc);ctx.lineTo(x+23*sc,yy+19*sc);ctx.lineTo(x+5*sc,yy+14*sc);ctx.lineTo(x,yy+25*sc);ctx.lineTo(x-8*sc,yy+14*sc);ctx.lineTo(x-26*sc,yy+19*sc);ctx.lineTo(x-17*sc,yy+4*sc);ctx.lineTo(x-29*sc,yy+2*sc);ctx.closePath();ctx.fill();ctx.strokeStyle='#4cad70aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,yy-15*sc);ctx.lineTo(x-7*sc,yy+1*sc);ctx.moveTo(x+2*sc,yy-10*sc);ctx.lineTo(x+10*sc,yy+3*sc);ctx.stroke()}}}
else {ctx.fillStyle='#e8f4ff88';for(let i=0;i<6;i++){const x=(i*W/5+40)%(W+90),y=H*.19+(i%2)*H*.09;ctx.beginPath();ctx.ellipse(x,y,35,10,0,0,7);ctx.ellipse(x+18,y-5,23,13,0,0,7);ctx.fill()}}
if(map.crowd){for(let x=0;x<W;x+=7){ctx.fillStyle=['#e7c8a4','#ed5961','#4bc7ed','#f6d45e','#ffffff'][Math.floor(x/7)%5];ctx.fillRect(x,H*.39+(x%3),4,9)}}
}
function drawField(){const top=H*.39,ground=H*.81;ctx.fillStyle=map.grass;ctx.fillRect(0,top,W,ground-top);for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#ffffff08':map.stripe;ctx.globalAlpha=.55;ctx.fillRect(i*W/10,top,W/10,ground-top);ctx.globalAlpha=1}const turfSheen=ctx.createLinearGradient(0,top,0,ground);turfSheen.addColorStop(0,'#ffffff10');turfSheen.addColorStop(.55,'#00000000');turfSheen.addColorStop(1,'#031a1c35');ctx.fillStyle=turfSheen;ctx.fillRect(0,top,W,ground-top);ctx.strokeStyle=map.snow?'#fff':'#d7fff0c9';ctx.lineWidth=2.4;ctx.strokeRect(W*.025,top+5,W*.95,ground-top-5);ctx.beginPath();ctx.moveTo(W/2,top+5);ctx.lineTo(W/2,ground);ctx.stroke();ctx.beginPath();ctx.arc(W/2,(top+ground)/2,H*.09,0,7);ctx.stroke();ctx.fillStyle='#ffffff99';ctx.beginPath();ctx.arc(W/2,(top+ground)/2,4,0,7);ctx.fill();const boxH=(ground-top)*.53,boxW=W*.13;ctx.strokeStyle=map.snow?'#ffffffcc':'#eafff2a0';ctx.lineWidth=2;ctx.strokeRect(0,ground-boxH,boxW,boxH);ctx.strokeRect(W-boxW,ground-boxH,boxW,boxH);ctx.strokeRect(0,ground-boxH*.42,boxW*.46,boxH*.42);ctx.strokeRect(W-boxW*.46,ground-boxH*.42,boxW*.46,boxH*.42);
const gy=H*.53,gh=H*.28,gw=W*.072;
for(const x of [W*.045,W*.955]){
 const left=x<W/2,dir=left?1:-1,backX=x+dir*gw*.46,backY=gy+gh*.08;
 // Cast shadow anchors the goal to the turf.
 ctx.fillStyle='#061d24aa';ctx.beginPath();ctx.ellipse(x+dir*gw*.16,ground+3,gw*.95,8,0,0,7);ctx.fill();
 // Net depth: visible side panel and roof plane.
 ctx.fillStyle='#d7eaf0aa';ctx.beginPath();ctx.moveTo(x-gw/2,gy);ctx.lineTo(x+gw/2,gy);ctx.lineTo(backX+gw/2,backY);ctx.lineTo(backX-gw/2,backY);ctx.closePath();ctx.fill();
 ctx.fillStyle='#b9d3df66';ctx.beginPath();ctx.moveTo(x+gw/2,gy);ctx.lineTo(backX+gw/2,backY);ctx.lineTo(backX+gw/2,ground);ctx.lineTo(x+gw/2,ground);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#7899aa';ctx.lineWidth=1.5;
 for(let i=1;i<7;i++){const yy=gy+gh*i/7;ctx.beginPath();ctx.moveTo(x-gw/2,yy);ctx.lineTo(x+gw/2,yy);ctx.lineTo(backX+gw/2,backY+(ground-backY)*i/7);ctx.stroke()}
 for(let i=1;i<6;i++){const xx=x-gw/2+gw*i/6;ctx.beginPath();ctx.moveTo(xx,gy);ctx.lineTo(xx,ground);ctx.lineTo(xx+dir*gw*.46,backY+(ground-backY)*(i/6));ctx.stroke()}
 // Rounded, thick posts and crossbar with highlights.
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#243c4c';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(x-gw/2,ground);ctx.lineTo(x-gw/2,gy);ctx.lineTo(x+gw/2,gy);ctx.lineTo(x+gw/2,ground);ctx.stroke();
 ctx.strokeStyle='#f7fbff';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x-gw/2,ground);ctx.lineTo(x-gw/2,gy);ctx.lineTo(x+gw/2,gy);ctx.lineTo(x+gw/2,ground);ctx.stroke();
 ctx.strokeStyle='#b4cbd8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-gw/2+2,ground);ctx.lineTo(x-gw/2+2,gy+2);ctx.lineTo(x+gw/2-2,gy+2);ctx.lineTo(x+gw/2-2,ground);ctx.stroke();
 // Rear upright makes the goal visibly three-dimensional.
 ctx.strokeStyle='#d6e7f0';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(backX-gw/2,backY);ctx.lineTo(backX-gw/2,ground);ctx.moveTo(backX+gw/2,backY);ctx.lineTo(backX+gw/2,ground);ctx.stroke();
 ctx.fillStyle='#dbe9f2';ctx.beginPath();ctx.ellipse(x-gw/2,ground,6,3,0,0,7);ctx.ellipse(x+gw/2,ground,6,3,0,0,7);ctx.fill();
}
ctx.fillStyle='#061522';ctx.fillRect(0,ground,W,H-ground);ctx.fillStyle='#102b37';ctx.fillRect(0,ground+8,W,Math.max(0,H-ground-8));ctx.fillStyle=map.grass;ctx.fillRect(0,ground-6,W,6);ctx.fillStyle='#e4fff4';ctx.fillRect(0,ground-2,W,2)}
function drawPlayer(p){
 const x=p.x,y=p.y,r=p.r,t=p.team,sc=r/34;
 ctx.save();
 const floorY=H*.81,airGap=clamp(floorY-y,0,H*.47),lift=clamp(airGap/(H*.47),0,1);
 ctx.globalAlpha=.30-.13*lift;ctx.fillStyle='#06131b';ctx.beginPath();ctx.ellipse(x,floorY-1,25-7*lift,5-1.5*lift,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 if(p.dashFlash>0){p.dashFlash=Math.max(0,p.dashFlash-.016);ctx.globalAlpha=.24;ctx.fillStyle=t.color;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x-p.dashDir*i*11,y-29,13-i*2,22-i*3,0,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
 ctx.translate(x,y);ctx.scale(sc*.86,sc);
 const run=Math.sin(p.run*3.2)*Math.min(4,Math.abs(p.vx)*.35);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#071522';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-6,-11);ctx.lineTo(-8+run,-2);ctx.moveTo(6,-11);ctx.lineTo(8-run,-2);ctx.stroke();
 ctx.strokeStyle=t.dark;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-6,-11);ctx.lineTo(-8+run,-2);ctx.moveTo(6,-11);ctx.lineTo(8-run,-2);ctx.stroke();
 roundRect(-16+run,-4,13,6,2,'#152333','#07111c');roundRect(3-run,-4,13,6,2,'#152333','#07111c');
 ctx.fillStyle='#ffffff55';ctx.fillRect(-13+run,-3,6,1);ctx.fillRect(6-run,-3,6,1);
 ctx.strokeStyle='#071522';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-10,-30);ctx.lineTo(-18,-17);ctx.moveTo(10,-30);ctx.lineTo(18,-17);ctx.stroke();
 ctx.strokeStyle=t.color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-10,-30);ctx.lineTo(-18,-17);ctx.moveTo(10,-30);ctx.lineTo(18,-17);ctx.stroke();
 ctx.fillStyle=t.trim;ctx.beginPath();ctx.arc(-19,-15,3.4,0,Math.PI*2);ctx.arc(19,-15,3.4,0,Math.PI*2);ctx.fill();
 const jersey=ctx.createLinearGradient(-12,-34,13,-5);jersey.addColorStop(0,t.color);jersey.addColorStop(.7,t.color);jersey.addColorStop(1,t.dark);
 roundRect(-14,-35,28,29,7,jersey,'#071522');
 roundRect(-11,-32,22,23,5,'#ffffff0b',null);
 ctx.fillStyle=t.trim;ctx.fillRect(-2,-27,4,17);
 ctx.strokeStyle='#ffffffb8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,-33);ctx.lineTo(0,-29);ctx.lineTo(5,-33);ctx.stroke();
 ctx.fillStyle='#ffffffed';ctx.font='900 8px Nunito';ctx.textAlign='center';ctx.fillText(p===p1?'7':'9',0,-14);
 ctx.strokeStyle='#ffffff55';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-9,-27);ctx.lineTo(-9,-11);ctx.moveTo(9,-27);ctx.lineTo(9,-11);ctx.stroke();
 ctx.fillStyle=t.dark;ctx.beginPath();ctx.arc(-22,-57,5,0,Math.PI*2);ctx.arc(22,-57,5,0,Math.PI*2);ctx.fill();
 const head=ctx.createRadialGradient(-9,-68,2,2,-54,32);head.addColorStop(0,'#ffffff70');head.addColorStop(.34,t.color);head.addColorStop(1,t.dark);
 ctx.fillStyle=head;ctx.beginPath();ctx.arc(0,-57,25,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#081421';ctx.lineWidth=3.5;ctx.stroke();
 ctx.fillStyle='#ffffff3e';ctx.beginPath();ctx.ellipse(-9,-70,8,3,-.45,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=t.hair;
 if(t.style===0){ctx.beginPath();ctx.arc(0,-60,24,Math.PI,Math.PI*2);ctx.lineTo(22,-60);ctx.quadraticCurveTo(9,-69,-4,-64);ctx.quadraticCurveTo(-16,-60,-23,-62);ctx.closePath();ctx.fill()}
 if(t.style===1){ctx.beginPath();ctx.moveTo(-24,-61);ctx.lineTo(-22,-75);ctx.lineTo(-11,-70);ctx.lineTo(-3,-82);ctx.lineTo(5,-72);ctx.lineTo(15,-78);ctx.lineTo(24,-64);ctx.lineTo(18,-59);ctx.quadraticCurveTo(0,-66,-24,-61);ctx.fill()}
 if(t.style===2){ctx.beginPath();ctx.arc(0,-62,24,Math.PI,Math.PI*2);ctx.lineTo(23,-59);ctx.quadraticCurveTo(0,-68,-23,-59);ctx.closePath();ctx.fill();for(let hx=-18;hx<=18;hx+=12){ctx.beginPath();ctx.arc(hx,-73,7,0,Math.PI*2);ctx.fill()}}
 if(t.style===3){ctx.beginPath();ctx.moveTo(-25,-59);ctx.lineTo(-22,-76);ctx.quadraticCurveTo(-3,-84,17,-73);ctx.lineTo(25,-65);ctx.lineTo(17,-61);ctx.quadraticCurveTo(0,-70,-25,-59);ctx.fill()}
 if(t.style===4){ctx.fillStyle='#ffd94b';ctx.beginPath();ctx.moveTo(-18,-77);ctx.lineTo(-22,-91);ctx.lineTo(-8,-84);ctx.lineTo(0,-96);ctx.lineTo(8,-84);ctx.lineTo(22,-91);ctx.lineTo(18,-76);ctx.closePath();ctx.fill();ctx.strokeStyle='#8b5714';ctx.lineWidth=1.5;ctx.stroke()}
 if(t.style===5){ctx.beginPath();ctx.moveTo(-23,-60);ctx.lineTo(-19,-77);ctx.lineTo(-8,-68);ctx.lineTo(0,-83);ctx.lineTo(8,-69);ctx.lineTo(19,-77);ctx.lineTo(24,-60);ctx.closePath();ctx.fill()}
 ctx.fillStyle='#f8fdff';ctx.beginPath();ctx.ellipse(-9,-56,4.8,6,0,0,Math.PI*2);ctx.ellipse(9,-56,4.8,6,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#102033';ctx.beginPath();ctx.arc(-9+p.face*1.4,-55,2.5,0,Math.PI*2);ctx.arc(9+p.face*1.4,-55,2.5,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-10+p.face*1.4,-57,1,0,Math.PI*2);ctx.arc(8+p.face*1.4,-57,1,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=t.hair;ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(-14,-64);ctx.lineTo(-5,-63);ctx.moveTo(5,-63);ctx.lineTo(14,-64);ctx.stroke();
 ctx.strokeStyle='#172331';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-45,6,.18,Math.PI-.18);ctx.stroke();
 if(p===p1){roundRect(-30,-111,60,17,7,'#071421dd','#ffffff55');ctx.fillStyle=t.color;ctx.font='900 9px Nunito';ctx.textAlign='center';ctx.fillText('PLAYER 1',0,-99)}
 ctx.restore()
}
function drawBall(){
 const floorY=H*.81;
 const height=clamp((floorY-(ball.y+ball.r))/(H*.55),0,1);
 const shadowH=Math.max(2,ball.r*(.40-.16*height)),shadowW=ball.r*(1.28-.58*height);
 ctx.save();ctx.globalAlpha=.43-.23*height;ctx.fillStyle='#03121a';ctx.beginPath();ctx.ellipse(ball.x,floorY-1,shadowW,shadowH,0,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();ctx.translate(ball.x,ball.y);ctx.rotate(ball.spin);
 let base='#eaf2f8',dark='#243746',accent='#ffffff';
 if(map.space){base='#b5a0ff';dark='#30255e';accent='#f1deff'}
 else if(map.jungle){base='#b5ff72';dark='#267c37';accent='#f2ffc7'}
 else if(map.sunset){base='#ff8a56';dark='#a82945';accent='#ffe0a6'}
 else if(map.street){base='#ffb94a';dark='#252b3b';accent='#fff0bf'}
 else if(map.indoor){base='#5de9e0';dark='#154a62';accent='#c5fff5'}
 else if(map.beach){base='#ffcf45';dark='#e26c39';accent='#fff1a4'}
 else if(map.snow){base='#7deaff';dark='#26779e';accent='#ffffff'}
 const g=ctx.createRadialGradient(-ball.r*.38,-ball.r*.48,1,ball.r*.12,ball.r*.18,ball.r*1.25);
 g.addColorStop(0,'#ffffff');g.addColorStop(.22,accent);g.addColorStop(.62,base);g.addColorStop(1,dark);
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,ball.r,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=dark;ctx.lineWidth=Math.max(1.3,ball.r*.07);ctx.stroke();
 if(map.beach){for(let i=0;i<6;i++){ctx.strokeStyle=['#ff4e59','#28adff','#fff'][i%3];ctx.lineWidth=ball.r*.19;ctx.beginPath();ctx.arc(0,0,ball.r*.68,i*Math.PI/3,i*Math.PI/3+1.28);ctx.stroke()}}
 else if(map.snow){ctx.strokeStyle='#ffffff';ctx.lineWidth=ball.r*.16;ctx.beginPath();ctx.moveTo(-ball.r*.62,0);ctx.lineTo(ball.r*.62,0);ctx.moveTo(0,-ball.r*.62);ctx.lineTo(0,ball.r*.62);ctx.stroke();ctx.beginPath();ctx.arc(0,0,ball.r*.39,0,Math.PI*2);ctx.stroke()}
 else if(map.space||map.jungle||map.sunset||map.street||map.indoor){ctx.strokeStyle=dark;ctx.lineWidth=ball.r*.20;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,ball.r*(.34+i*.17),i*2.1,i*2.1+2.5);ctx.stroke()}ctx.strokeStyle=accent;ctx.lineWidth=Math.max(1,ball.r*.045);ctx.beginPath();ctx.arc(-ball.r*.12,-ball.r*.12,ball.r*.72,3.6,4.8);ctx.stroke()}
 else{ctx.fillStyle='#172735';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*ball.r*.52,Math.sin(a)*ball.r*.52,ball.r*.22,0,Math.PI*2);ctx.fill()}}
 ctx.fillStyle='#ffffffaa';ctx.beginPath();ctx.ellipse(-ball.r*.29,-ball.r*.43,ball.r*.27,ball.r*.13,-.55,0,Math.PI*2);ctx.fill();
 ctx.restore()
}
function render(){drawBackground();drawField();drawPlayer(p1);drawPlayer(p2);drawBall();$('bluePower').style.width=(charge.blue*100)+'%';$('redPower').style.width=(charge.red*100)+'%'}
function loop(now){if(!running)return;const dt=Math.min(.032,(now-last)/1000||.016);last=now;if(!paused)update(dt);render();raf=requestAnimationFrame(loop)}
$('play').onclick=start;$('back').onclick=back;$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ RESUME':'Ⅱ PAUSE';$('banner').textContent=paused?'PAUSED':''};$('fullscreen').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
const tapHistory={};addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!e.repeat&&['a','d','arrowleft','arrowright'].includes(k)){const now=performance.now();const id=(k==='arrowleft'?'left':k==='arrowright'?'right':k);const player=id==='left'||id==='right'?p2:p1;if(tapHistory[id]&&now-tapHistory[id]<320&&player.dashCooldown<=0){player.dashDir=(id==='a'||id==='left')?-1:1;player.dashTime=.38;player.dashCooldown=5;player.dashFlash=.38;$('status').textContent=(player===p1?'BLUE':'RED')+' DASH! 5s cooldown';}tapHistory[id]=now}if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys[k==='arrowleft'?'left':k==='arrowright'?'right':k==='arrowup'?'up':k==='arrowdown'?'down':k]=true;if(k==='escape'&&$('game').classList.contains('hidden')===false){paused=!paused;$('banner').textContent=paused?'PAUSED':''}});addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys[k==='arrowleft'?'left':k==='arrowright'?'right':k==='arrowup'?'up':k==='arrowdown'?'down':k]=false});document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;b.setPointerCapture?.(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys[k]=false)});addEventListener('resize',()=>{if(!$('game').classList.contains('hidden'))resize()});addEventListener('blur',()=>{keys={}});resize();render();
})();
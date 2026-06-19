
(function(){
  const $=id=>document.getElementById(id);
  const canvas=$('wheel'); const ctx=canvas.getContext('2d');
  const PAYPAL_POOL_URL='https://www.paypal.com/pool/9pYiOg51Iv?sr=accr';
  const ENTRY_FEE=5; const CURRENCY='GBP';
  let state={teams:[],draws:[]}; let rotation=0; let spinning=false; let paid=false; let currentPaymentRef='PAYPAL-POOL'; let lastAvailableBeforeSpin=[];
  const TWO=Math.PI*2;

  function moneySymbol(){return CURRENCY==='GBP'?'£':CURRENCY==='EUR'?'€':'$'}
  function escapeHtml(str){return String(str||'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
  function showError(msg){$('errorBox').textContent=msg;$('errorBox').classList.remove('hidden')}
  function clearError(){$('errorBox').classList.add('hidden');$('errorBox').textContent=''}
  function availableTeams(){return (state.teams||[]).filter(t=>!t.taken)}

  async function api(path, options={}){
    const res=await fetch('/.netlify/functions/'+path,{headers:{'Content-Type':'application/json'},cache:'no-store',...options});
    let data={}; try{data=await res.json()}catch(e){}
    if(!res.ok || data.ok===false) throw new Error(data.error || ('Request failed: '+res.status));
    return data;
  }

  async function loadSharedState(){
    clearError();
    try{
      const data=await api('get-state');
      state=data.state;
      $('resultBanner').innerHTML='<div><h2>Team Names Have Been Removed From The Wheel To Hide Remaining Teams</h2><p>The Team You Draw Will Appear</p><h2 style="margin-top:12px">Ready to spin</h2><p>Complete the player and payment step first.</p></div>';
      refresh();
    }catch(err){
      state={teams:[],draws:[]};
      drawWheel(); renderDraws(); updateStats();
      $('resultBanner').innerHTML='<div><h2>Setup needed</h2><p>Netlify Functions are not responding yet.</p></div>';
      showError('The shared draw record could not be loaded. Check that the Netlify deploy includes the netlify/functions folder. '+err.message);
    }
  }

  function updateStats(){const total=(state.teams||[]).length||48;const remaining=availableTeams().length;const taken=Math.max(0,total-remaining);const pct=total?Math.round((taken/total)*100):0;$('statRemaining').textContent=remaining;$('statTaken').textContent=taken;$('statPot').textContent=moneySymbol()+(taken*ENTRY_FEE).toFixed(0);$('feeLabel').textContent=moneySymbol()+ENTRY_FEE.toFixed(2);$('progressSold').textContent=taken;$('progressTotal').textContent=total;$('progressFill').style.width=Math.min(100,pct)+'%';$('progressText').textContent=pct+'% sold so far.'}

  function drawWheel(){
    const teams=availableTeams(); const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=Math.min(w,h)/2-18;
    ctx.clearRect(0,0,w,h);
    if(!teams.length){ctx.fillStyle='#123d34';ctx.beginPath();ctx.arc(cx,cy,r,0,TWO);ctx.fill();ctx.fillStyle='#ffcf5a';ctx.font='bold 48px system-ui';ctx.textAlign='center';ctx.fillText((state.teams||[]).length?'SOLD OUT':'NO TEAMS',cx,cy);return}
    const slice=TWO/teams.length; const palette=['#36d399','#ffcf5a','#70d6ff','#ff8fab','#b8f7d4','#ffd166','#9bf6ff','#cdb4db','#80ed99','#fca311'];
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation);ctx.translate(-cx,-cy);
    teams.forEach((team,i)=>{const start=i*slice,end=start+slice;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();ctx.fillStyle=palette[i%palette.length];ctx.fill();ctx.strokeStyle='rgba(3,32,24,.35)';ctx.lineWidth=2;ctx.stroke();/* Country names intentionally hidden on the wheel so remaining teams are not revealed before the spin. */});
    ctx.restore();ctx.beginPath();ctx.arc(cx,cy,r,0,TWO);ctx.strokeStyle='rgba(255,255,255,.33)';ctx.lineWidth=12;ctx.stroke();
  }

  function renderDraws(){
    const revealTeams = !!state.revealTeamsInDrawRecord;
    if(!state.draws || !state.draws.length){$('drawTable').innerHTML='<tr><td colspan="3">No teams have been drawn yet.</td></tr>';return}
    $('drawTable').innerHTML=state.draws.slice().reverse().map(d=>{
      const teamCell = revealTeams ? `<strong>${escapeHtml(d.team)}</strong>` : '<em>Hidden until all tickets are sold</em>';
      return `<tr><td>${new Date(d.drawnAt).toLocaleString()}</td><td>${escapeHtml(d.playerName)}</td><td>${teamCell}</td></tr>`;
    }).join('');
  }

  function refresh(){updateStats();drawWheel();renderDraws();$('spinBtn').disabled=!paid||spinning||!availableTeams().length}
  function validatePlayer(){const name=$('playerName').value.trim();const email=$('playerEmail').value.trim();if(!name){alert('Please enter the player name.');return null}if(!email||!email.includes('@')){alert('Please enter a valid email address.');return null}return{name,email}}

  $('unlockBtn').addEventListener('click',()=>{const player=validatePlayer();if(!player)return;paid=true;currentPaymentRef='PAYPAL-POOL-'+Date.now();$('resultBanner').innerHTML='<div><h2>Payment marked</h2><p>Now spin the wheel to draw your team.</p></div>';refresh()});

  function finalRotationForTeam(chosenName){
    const teams=lastAvailableBeforeSpin; const idx=Math.max(0,teams.findIndex(t=>t.name===chosenName)); const slice=TWO/teams.length; const pointer=-Math.PI/2; const targetAngle=idx*slice+slice/2; let base=pointer-targetAngle; const min=rotation+TWO*7; while(base<min)base+=TWO; return base;
  }

  async function spin(){
    const player=validatePlayer(); if(!player||!paid||spinning)return; const teams=availableTeams(); if(!teams.length){alert('All teams have been drawn.');return}
    spinning=true;$('spinBtn').disabled=true;clearError();lastAvailableBeforeSpin=teams.slice();
    let data;
    try{data=await api('draw-team',{method:'POST',body:JSON.stringify({playerName:player.name,playerEmail:player.email,paymentRef:currentPaymentRef})})}
    catch(err){spinning=false;refresh();showError(err.message);return}
    const start=rotation; const end=finalRotationForTeam(data.draw.team); const duration=5200; const started=performance.now();
    function easeOutCubic(t){return 1-Math.pow(1-t,3)}
    function frame(now){const p=Math.min(1,(now-started)/duration);rotation=start+(end-start)*easeOutCubic(p);drawWheelUsingList(lastAvailableBeforeSpin);if(p<1)requestAnimationFrame(frame);else finishSpin(data)}
    requestAnimationFrame(frame);
  }

  function drawWheelUsingList(teams){
    const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=Math.min(w,h)/2-18;ctx.clearRect(0,0,w,h);if(!teams.length)return;const slice=TWO/teams.length;const palette=['#36d399','#ffcf5a','#70d6ff','#ff8fab','#b8f7d4','#ffd166','#9bf6ff','#cdb4db','#80ed99','#fca311'];ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation);ctx.translate(-cx,-cy);teams.forEach((team,i)=>{const start=i*slice,end=start+slice;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();ctx.fillStyle=palette[i%palette.length];ctx.fill();ctx.strokeStyle='rgba(3,32,24,.35)';ctx.lineWidth=2;ctx.stroke();/* Country names intentionally hidden on the wheel so remaining teams are not revealed before the spin. */});ctx.restore();ctx.beginPath();ctx.arc(cx,cy,r,0,TWO);ctx.strokeStyle='rgba(255,255,255,.33)';ctx.lineWidth=12;ctx.stroke();
  }

  function finishSpin(data){
    state=data.state; paid=false; currentPaymentRef=''; spinning=false;
    $('resultBanner').innerHTML=`<div><h2>${escapeHtml(data.draw.playerName)} drew ${escapeHtml(data.draw.team)}!</h2><p>Group ${escapeHtml(data.draw.group)}. This team has now been removed from future draws.</p></div>`;
    $('playerName').value='';$('playerEmail').value='';refresh();
  }

  $('spinBtn').addEventListener('click',spin);
  async function setDrawRecordReveal(reveal){
    const pin=$('adminPin').value.trim();
    if(!pin){alert('Enter the admin PIN.');return}
    try{
      const data=await api('set-reveal',{method:'POST',body:JSON.stringify({pin,reveal})});
      state=data.state;
      $('resultBanner').innerHTML = reveal
        ? '<div><h2>Teams revealed</h2><p>The draw record now shows selected teams.</p></div>'
        : '<div><h2>Teams hidden</h2><p>The draw record now hides selected teams.</p></div>';
      refresh();
    }catch(err){showError(err.message)}
  }
  $('revealBtn').addEventListener('click',()=>setDrawRecordReveal(true));
  $('hideTeamsBtn').addEventListener('click',()=>setDrawRecordReveal(false));

  function csvEscape(value){
    const str=String(value ?? '');
    return /[",\n\r]/.test(str) ? '"' + str.replace(/"/g,'""') + '"' : str;
  }

  function downloadEntrantsList(){
    const pin=$('adminPin').value.trim();
    if(!pin){alert('Enter the admin PIN before downloading the entrants list.');return}
    const draws=(state.draws||[]).slice();
    if(!draws.length){alert('No entrants have been drawn yet.');return}
    const rows=[['Date/time','Player name','Email address','Drawn team','Group','Payment ref','Admin allocated']];
    draws.forEach(d=>{
      rows.push([
        d.drawnAt ? new Date(d.drawnAt).toLocaleString() : '',
        d.playerName || '',
        d.playerEmail || '',
        d.team || '',
        d.group || '',
        d.paymentRef || '',
        d.adminAllocated ? 'Yes' : 'No'
      ]);
    });
    const csv=rows.map(row=>row.map(csvEscape).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const stamp=new Date().toISOString().slice(0,10);
    a.href=url;
    a.download='world-cup-2026-sweepstake-entrants-'+stamp+'.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  $('downloadEntrantsBtn').addEventListener('click',downloadEntrantsList);
  $('resetBtn').addEventListener('click',async()=>{const pin=$('adminPin').value.trim(); if(!pin){alert('Enter the admin PIN.');return} if(!confirm('Reset the sweepstake and make all teams available again?'))return; try{const data=await api('reset-sweepstake',{method:'POST',body:JSON.stringify({pin})});state=data.state;paid=false;rotation=0;$('resultBanner').innerHTML='<div><h2>Sweepstake reset</h2><p>All teams are available again.</p></div>';refresh();}catch(err){showError(err.message)}});

  loadSharedState();
})();

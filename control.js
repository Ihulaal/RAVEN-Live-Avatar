import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const $=id=>document.getElementById(id);
const cfg=window.RAVEN_CONFIG||{};
const validConfig=/^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'') && (cfg.publishableKey||'').length>20;
const client=validConfig?createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}}):null;
let channel=null,ready=false,stream=null,context=null,source=null,analyser=null,ticker=null,demoTimeout=null,sending=false;
const N=48;
let room = new URLSearchParams(location.search).get('room') || localStorage.getItem('raven-room') || newRoom();
room=normalizeRoom(room); if(!room)room=newRoom();
function normalizeRoom(x){return String(x||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90);}
function newRoom(){return 'rv-'+Array.from(crypto.getRandomValues(new Uint8Array(14)),b=>b.toString(16).padStart(2,'0')).join('');}
function overlayURL(){return new URL('index.html?room='+encodeURIComponent(room),location.href).toString();}
function drawLink(){$('room').value=room;$('overlayUrl').textContent=overlayURL();$('preview').src=overlayURL();}
function setStatus(t){$('status').textContent=t;}
function feedback(t){$('feedback').textContent=t;}
function connect(){
  ready=false;
  if(channel&&client)client.removeChannel(channel);
  channel=null;
  if(!client){setStatus('Setup needed');feedback('Enter your Supabase project URL and publishable key in config.js, then upload the changes to GitHub.');return;}
  setStatus('Connecting...');feedback('');
  channel=client.channel('raven-'+room,{config:{private:false}});
  channel.subscribe((state,error)=>{
    ready=state==='SUBSCRIBED';setStatus(state==='SUBSCRIBED'?'Connected':state);
    if(error)feedback('Connection error: '+String(error.message||error));
  });
}
async function send(bands){
  if(!ready||!channel||sending)return;
  sending=true;
  try{await channel.send({type:'broadcast',event:'bands',payload:{bands}});}
  catch(e){feedback('Broadcast error: '+e.message);}
  finally{sending=false;}
}
function makeBands(){
  const bins=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(bins);
  const bands=new Array(N);const maxBin=bins.length-1;
  let maxLevel=0;
  for(let i=0;i<N;i++){
    // Log-spaced frequency bands with more definition in the audible bass range.
    const a=Math.max(1,Math.floor(Math.pow(maxBin,(i+.15)/N)));
    const b=Math.max(a+1,Math.floor(Math.pow(maxBin,(i+1)/N)));
    let sum=0;
    for(let k=a;k<Math.min(b,maxBin);k++)sum+=bins[k]*bins[k];
    const rms=Math.sqrt(sum/Math.max(1,Math.min(b,maxBin)-a))/255;
    const v=Math.min(1,Math.max(0,rms*Number($('sensitivity').value)*1.85-.015));
    bands[i]=Number(v.toFixed(3));if(v>maxLevel)maxLevel=v;
  }
  $('meter').style.width=Math.round(maxLevel*100)+'%';
  $('meterLabel').textContent='Level: '+Math.round(maxLevel*100)+'% · '+(ready?'Broadcasting':'Not connected');
  return bands;
}
async function startMedia(mode){
  clearTimeout(demoTimeout); await stopMedia(false);
  try{
    if(mode==='screen'){
      // Chrome requires a manual permission click. Share-tab-audio MUST be ticked.
      stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true,systemAudio:'include'});
    } else stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false},video:false});
    if(!stream.getAudioTracks().length)throw Error('No audio track was shared. Select a browser tab and enable “Share tab audio”, then try again.');
    context=new (window.AudioContext||window.webkitAudioContext)();
    source=context.createMediaStreamSource(stream); analyser=context.createAnalyser();
    analyser.fftSize=2048;analyser.smoothingTimeConstant=.7;source.connect(analyser);
    $('meterLabel').textContent='Listening for audio...';feedback('Audio capture active. Play music to test.');
    stream.getTracks().forEach(t=>t.addEventListener('ended',()=>stopMedia(),{once:true}));
    ticker=setInterval(()=>send(makeBands()),140);
  } catch(e){feedback('Capture did not start: '+e.message);await stopMedia(false);}
}
async function stopMedia(announce=true){clearInterval(ticker);ticker=null;
  if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
  if(context){await context.close().catch(()=>{});context=null;}
  analyser=null;source=null;
  $('meter').style.width='0%';$('meterLabel').textContent='Level: 0% · Stopped';
  await send(Array(N).fill(0));if(announce)feedback('Audio capture stopped.');
}
function stopDemo(){clearTimeout(demoTimeout);clearInterval(ticker);ticker=null;send(Array(N).fill(0));$('meter').style.width='0%';}
function test(){clearInterval(ticker);clearTimeout(demoTimeout);stopMedia(false).then(()=>{
  const until=Date.now()+12000;
  ticker=setInterval(()=>{
    const t=Date.now()/300;
    const bands=Array.from({length:N},(_,i)=>Number((.2+.7*Math.pow(Math.sin(t+i*.41),2)).toFixed(3)));
    $('meter').style.width='75%';$('meterLabel').textContent='Test wave broadcasting...';send(bands);
    if(Date.now()>=until)stopDemo();
  },140);
  demoTimeout=setTimeout(()=>{stopDemo();feedback('Test completed.');},12050);
  feedback('Test broadcasting for 12 seconds.');
 });}
function setRoom(next){stopDemo();stopMedia(false);room=normalizeRoom(next)||newRoom();localStorage.setItem('raven-room',room);drawLink();history.replaceState(null,'','control.html?room='+encodeURIComponent(room));connect();}
$('changeRoom').onclick=()=>setRoom($('room').value);
$('randomRoom').onclick=()=>setRoom(newRoom());
$('copyOverlay').onclick=async()=>{try{await navigator.clipboard.writeText(overlayURL());feedback('TikTok overlay URL copied.')}catch(e){feedback('Copy the URL shown above.')}};
$('shareTab').onclick=()=>startMedia('screen');$('microphone').onclick=()=>startMedia('microphone');$('stop').onclick=()=>stopMedia();
$('demo').onclick=test;$('demoStop').onclick=()=>{stopDemo();feedback('Test stopped.');};
$('sensitivity').oninput=()=>{$('sensVal').textContent=$('sensitivity').value;};
window.addEventListener('pagehide',()=>{if(stream)stream.getTracks().forEach(t=>t.stop());});
localStorage.setItem('raven-room',room);drawLink();connect();

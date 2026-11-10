import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const p = new URLSearchParams(location.search);
const room = (p.get('room') || '').replace(/[^A-Za-z0-9_-]/g,'').slice(0,90);
const demo = p.get('demo') === '1';
const canvas = document.querySelector('#wave'), ctx=canvas.getContext('2d');
const W=1080,H=1920,N=48;
const target = new Float32Array(N), smooth = new Float32Array(N);
let last=0;
const cfg=window.RAVEN_CONFIG||{};
if (!demo && room && cfg.supabaseUrl && cfg.publishableKey) {
  try {
    const client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const channel=client.channel('raven-'+room,{config:{private:false}});
    channel.on('broadcast',{event:'bands'},message=>{
      const a=message?.payload?.bands;
      if(!Array.isArray(a))return;
      for(let i=0;i<N;i++)target[i]=Math.max(0,Math.min(1,Number(a[i])||0));
      last=performance.now();
    }).subscribe();
  } catch(e){console.error('RAVEN Realtime connection error',e);}
}
function frame(ms){
  if(demo){let t=ms/1000;for(let i=0;i<N;i++)target[i]=(0.15+.65*Math.pow(Math.sin(t*5.8+i*.39),2));last=ms;}
  else if(ms-last>750)target.fill(0);
  ctx.clearRect(0,0,W,H);
  // Only the canvas changes. Both image layers are permanent, unanimated PNGs.
  for(let i=0;i<N;i++){let d=target[i]-smooth[i];smooth[i]+=d*(d>0?.48:.19);}
  const lineY=610;
  const bars=98;
  for(let j=0;j<bars;j++){
    const x=40+(W-80)*j/(bars-1);
    const fromMiddle=1-Math.abs(2*j/(bars-1)-1);
    const frequencyIndex=Math.min(N-1,Math.round((1-fromMiddle)*(N-1)));
    const amount=smooth[frequencyIndex];
    if(amount<.016)continue;
    const height=(13+230*amount)*(.15+.85*Math.pow(fromMiddle,.64));
    ctx.save();ctx.globalAlpha=Math.min(.92,.28+amount*.65);
    ctx.strokeStyle='#ff1928';ctx.lineWidth=6;ctx.shadowColor='#f00';ctx.shadowBlur=21;
    ctx.beginPath();ctx.moveTo(x,lineY-height);ctx.lineTo(x,lineY+height);ctx.stroke();
    ctx.shadowBlur=6;ctx.lineWidth=2;ctx.strokeStyle='#ffd0c9';ctx.stroke();ctx.restore();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

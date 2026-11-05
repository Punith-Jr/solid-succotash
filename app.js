(() => {
  const $ = s => document.querySelector(s), storeKey = 'orbit-assistant-v1';
  const state = JSON.parse(localStorage.getItem(storeKey) || '{"tasks":[],"notes":[]}');
  const save = () => localStorage.setItem(storeKey, JSON.stringify(state));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let toastTimer;
  function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
  function render(){
    const tasks=$('#tasks'); tasks.innerHTML=state.tasks.length ? state.tasks.map((t,i)=>`<article class="task ${t.done?'done':''}"><button class="check" data-done="${i}" aria-label="${t.done?'Mark incomplete':'Mark complete'}">${t.done?'✓':''}</button><div class="task-copy"><div class="task-title">${esc(t.text)}</div><div class="task-time">${t.at?`Reminder · ${esc(new Date(t.at).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'}))}`:'Anytime'}</div></div><button class="delete" data-task="${i}" aria-label="Delete task">×</button></article>`).join('') : '<div class="empty">Your mind can rest. Add a task whenever you need one.</div>';
    const notes=$('#notes');notes.innerHTML=state.notes.length?state.notes.map((n,i)=>`<article class="note"><p>${esc(n.text)}</p><time>${esc(n.when)}</time><button class="delete" data-note="${i}" aria-label="Delete note">×</button></article>`).join(''):'<div class="empty" style="grid-column:1/-1">Little thoughts, saved for later.</div>';
  }
  function addTask(text, at=null){state.tasks.unshift({text,at,done:false});save();render();if(at) scheduleReminder(text,at);}
  function scheduleReminder(text,at){const delay=new Date(at).getTime()-Date.now();if(delay>0&&delay<2147480000){setTimeout(()=>{toast(`Reminder: ${text}`);if('Notification'in window&&Notification.permission==='granted')new Notification('Orbit reminder',{body:text,icon:'icon.svg'});},delay)}}
  function parseTime(input){const m=input.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);if(!m)return null;let h=+m[1],min=+(m[2]||0);if(m[3].toLowerCase()==='pm'&&h<12)h+=12;if(m[3].toLowerCase()==='am'&&h===12)h=0;const d=new Date();d.setHours(h,min,0,0);if(d<Date.now())d.setDate(d.getDate()+1);return d.toISOString()}
  function handle(){const input=$('#prompt').value.trim();if(!input)return;let match=input.match(/^(?:remind me to|remind me|add task|task)\s+(.+?)(?:\s+\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)?[.!]?$/i);
    if(match){const text=match[1].replace(/[.!]$/,'').trim();const at=parseTime(input);addTask(text,at);toast(at?'Reminder set. I’ll let you know.':'Task added to your day.');}
    else if(/^(?:note|save a note|remember)\b/i.test(input)){const text=input.replace(/^(?:note|save a note|remember)\s*(?:that\s*)?/i,'').trim();if(!text){toast('Add a few words after “note”.');return}state.notes.unshift({text,when:new Date().toLocaleDateString([], {month:'short',day:'numeric'})});save();render();toast('Saved to your notes.');}
    else if(/^(?:help|what can you do|hi|hello)\b/i.test(input)){toast('Try: “remind me to stretch at 4pm”, “task buy milk”, or “note book idea”.')}
    else {state.notes.unshift({text:input,when:new Date().toLocaleDateString([], {month:'short',day:'numeric'})});save();render();toast('Saved as a quick note.');}
    $('#prompt').value='';
  }
  $('#sendBtn').addEventListener('click',handle);$('#prompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handle()}});
  document.addEventListener('click',e=>{const d=e.target.closest('[data-done]');if(d){state.tasks[+d.dataset.done].done=!state.tasks[+d.dataset.done].done;save();render()}const x=e.target.closest('[data-task]');if(x){state.tasks.splice(+x.dataset.task,1);save();render()}const n=e.target.closest('[data-note]');if(n){state.notes.splice(+n.dataset.note,1);save();render()}});
  $('#clearDone').addEventListener('click',()=>{state.tasks=state.tasks.filter(t=>!t.done);save();render();toast('Completed tasks cleared.')});
  $('#addNote').addEventListener('click',()=>{const v=prompt('What would you like to remember?');if(v?.trim()){state.notes.unshift({text:v.trim(),when:new Date().toLocaleDateString([], {month:'short',day:'numeric'})});save();render();toast('Note saved.')}});
  $('#notifyBtn').addEventListener('click',async()=>{if(!('Notification'in window)){toast('Notifications are not supported in this browser.');return}const p=await Notification.requestPermission();toast(p==='granted'?'Notifications enabled for reminders.':'Notifications were not enabled.')});
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){const rec=new SR();rec.lang=navigator.language||'en-US';rec.interimResults=false;$('#micBtn').addEventListener('click',()=>{rec.start();$('#micBtn').classList.add('listening')});rec.onresult=e=>{$('#prompt').value=e.results[0][0].transcript;$('#prompt').focus()};rec.onend=()=>$('#micBtn').classList.remove('listening');rec.onerror=()=>{$('#micBtn').classList.remove('listening');toast('Could not hear that. Try typing instead.')}}else $('#micBtn').addEventListener('click',()=>toast('Voice input is not supported here.'));
  state.tasks.filter(t=>t.at&&!t.done).forEach(t=>scheduleReminder(t.text,t.at));render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();

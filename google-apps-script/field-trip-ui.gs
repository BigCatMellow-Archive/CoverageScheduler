function getFieldTripUi_() {
  return `
<style>
  .ft-badge{display:inline-flex;align-items:center;padding:2px 6px;border-radius:999px;background:rgba(246,183,86,.18);color:#8a5a00;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
  .field-trip-row{border-left:3px solid var(--accent,#f6b756)}
  .ft-meta{margin-top:4px;font-size:10px;color:var(--text-muted,#6b7280);line-height:1.35}
  .ft-grade-grid{display:flex;flex-wrap:wrap;gap:6px}
  .ft-grade-check{position:relative}
  .ft-grade-check input{position:absolute;opacity:0;pointer-events:none}
  .ft-grade-check span{display:inline-flex;align-items:center;justify-content:center;min-width:40px;height:30px;padding:0 9px;border:1px solid #d7dce5;border-radius:8px;background:#fff;color:#566171;font-size:11px;font-weight:750;cursor:pointer}
  .ft-grade-check input:checked+span{background:rgba(33,66,137,.08);border-color:var(--primary,#214289);color:var(--primary,#214289)}
  .ft-staff-box{padding:10px;background:#f7f8fb;border:1px solid var(--border,#e2e5eb);border-radius:10px}
  .ft-staff-list{max-height:210px;overflow:auto;margin-top:8px;border:1px solid #d7dce5;border-radius:8px;background:#fff}
  .ft-staff-row{display:flex;align-items:flex-start;gap:8px;padding:8px 9px;border-bottom:1px solid #edf0f4;cursor:pointer}
  .ft-staff-row:last-child{border-bottom:0}
  .ft-staff-row:hover{background:#f7f8fb}
  .ft-staff-row input{margin-top:2px;accent-color:var(--primary,#214289)}
  .ft-staff-name{font-size:12px;font-weight:750;color:var(--text,#1f2937)}
  .ft-staff-sub{font-size:10px;color:var(--text-muted,#6b7280);margin-top:1px}
  .calendar-modal{width:min(980px,94vw);max-width:980px}
  .calendar-toolbar{display:flex;align-items:center;gap:8px}
  .calendar-toolbar .calendar-title{min-width:150px;text-align:center;font-size:14px;font-weight:800;color:var(--text,#1f2937)}
  .calendar-nav{border:1px solid #d7dce5;background:#fff;border-radius:8px;padding:6px 9px;cursor:pointer;color:var(--primary,#214289);font-weight:800}
  .calendar-weekdays,.calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
  .calendar-weekdays{border:1px solid var(--border,#e2e5eb);border-bottom:0;border-radius:10px 10px 0 0;overflow:hidden}
  .calendar-weekdays div{padding:7px 6px;background:#f7f8fb;border-right:1px solid var(--border,#e2e5eb);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b;text-align:center}
  .calendar-weekdays div:last-child{border-right:0}
  .calendar-grid{border-left:1px solid var(--border,#e2e5eb);border-top:1px solid var(--border,#e2e5eb)}
  .calendar-day{min-height:102px;padding:6px;border-right:1px solid var(--border,#e2e5eb);border-bottom:1px solid var(--border,#e2e5eb);background:#fff;overflow:hidden}
  .calendar-day.out{background:#f7f8fb;color:#94a3b8}
  .calendar-day.today{box-shadow:inset 0 0 0 2px rgba(33,66,137,.24)}
  .calendar-day-number{display:inline-flex;border:0;background:transparent;padding:0 2px 4px;font-size:11px;font-weight:800;color:inherit;cursor:pointer}
  .calendar-event{display:block;width:100%;margin:2px 0;padding:4px 5px;border:0;border-radius:6px;background:rgba(246,183,86,.18);color:#7c5208;text-align:left;font-size:9px;font-weight:750;line-height:1.25;cursor:pointer;white-space:normal}
  .calendar-event:hover{background:rgba(246,183,86,.28)}
  .calendar-absence{display:block;margin-top:3px;padding:2px 4px;border-radius:5px;background:#eef2f7;color:#64748b;font-size:8px;font-weight:700}
  .calendar-empty{padding:20px;color:var(--text-muted,#6b7280);text-align:center}
  @media(max-width:760px){.calendar-day{min-height:78px;padding:4px}.calendar-event{font-size:8px}.calendar-modal{width:96vw}}
</style>
<script>
(function(){
  var addAbsenceButton=document.getElementById('addAbsenceBtn');
  var fieldTripButton=document.createElement('button');
  fieldTripButton.id='addFieldTripBtn';
  fieldTripButton.type='button';
  fieldTripButton.className='add-btn';
  fieldTripButton.textContent='+ Field Trip';
  if(addAbsenceButton&&addAbsenceButton.parentNode){
    addAbsenceButton.parentNode.appendChild(fieldTripButton);
  }

  var topActions=document.querySelector('.top-actions');
  var calendarButton=document.createElement('button');
  calendarButton.id='calendarBtn';
  calendarButton.className='btn btn-ghost';
  calendarButton.textContent='Calendar';
  if(topActions){
    var generate=document.getElementById('generateBtn');
    if(generate&&generate.nextSibling) topActions.insertBefore(calendarButton,generate.nextSibling);
    else topActions.appendChild(calendarButton);
  }

  document.body.insertAdjacentHTML('beforeend',
    '<div id="fieldTripModal" class="overlay hidden">'+
      '<div class="modal modal-lg">'+
        '<div class="m-hd"><div><h2 id="fieldTripModalTitle">Add Field Trip</h2><div class="m-sub">Choose the students and staff who will be away. The scheduler will cancel those grade-level classes and reuse released teachers for coverage.</div></div><button class="m-x" data-ft-close="fieldTripModal">×</button></div>'+
        '<div class="m-body">'+
          '<div class="fg"><label class="fl">Trip Name</label><input id="ftName" class="fi" placeholder="2nd Grade Field Trip"></div>'+
          '<div class="f-row-3"><div class="fg"><label class="fl">Date</label><input id="ftDate" type="date" class="fi"></div><div class="fg"><label class="fl">Start</label><input id="ftStart" type="time" class="fi" value="09:00"></div><div class="fg"><label class="fl">End</label><input id="ftEnd" type="time" class="fi" value="14:00"></div></div>'+
          '<div class="fg"><label class="fl">Students on Trip</label><div id="ftGrades" class="ft-grade-grid"></div><div class="hint">Classes for these grades are treated as cancelled during the trip window.</div></div>'+
          '<div class="fg ft-staff-box"><label class="fl">Staff on Trip</label><input id="ftStaffSearch" class="fi" placeholder="Search staff…"><div id="ftStaffList" class="ft-staff-list"></div><div id="ftStaffHint" class="hint" style="margin-top:7px"></div></div>'+
          '<div class="fg"><label class="fl">Notes <span style="font-weight:500;text-transform:none">(optional)</span></label><textarea id="ftNotes" class="fta" placeholder="Destination, grade-level details, or anything the office should know"></textarea></div>'+
        '</div>'+
        '<div class="m-ft"><button id="deleteFieldTripBtn" class="btn-del hidden">Delete Field Trip</button><div class="sp-r"></div><button class="btn-cancel" data-ft-close="fieldTripModal">Cancel</button><button id="saveFieldTripBtn" class="btn-save">Save Field Trip</button></div>'+
      '</div>'+
    '</div>'+
    '<div id="calendarModal" class="overlay hidden">'+
      '<div class="modal calendar-modal">'+
        '<div class="m-hd"><div><h2>Coverage Calendar</h2><div class="m-sub">Field trips and ordinary absences in one monthly view.</div></div><button class="m-x" data-ft-close="calendarModal">×</button></div>'+
        '<div class="m-body">'+
          '<div class="calendar-toolbar"><button id="calendarPrev" class="calendar-nav">‹</button><div id="calendarTitle" class="calendar-title"></div><button id="calendarNext" class="calendar-nav">›</button><div class="sp-r"></div><button id="calendarAddTrip" class="btn-save">+ Field Trip</button></div>'+
          '<div style="height:10px"></div>'+
          '<div class="calendar-weekdays"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>'+
          '<div id="calendarGrid" class="calendar-grid"></div>'+
        '</div>'+
      '</div>'+
    '</div>'
  );

  var editingEventId='';
  var selectedStaff={};
  var calendarTrips=[];
  var calendarCursor=null;
  var gradeValues=['Beg','PreK','K','1','2','3','4','5','6','7','8'];

  function parseDateKey(value){
    var p=String(value||'').split('-').map(Number);
    if(p.length!==3||!p[0]||!p[1]||!p[2])return null;
    return new Date(p[0],p[1]-1,p[2],12,0,0,0);
  }
  function dateKey(d){
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function inputTime(value){
    var s=String(value||'').trim();
    if(/^\d{2}:\d{2}$/.test(s))return s;
    var m=s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if(!m)return '';
    var h=Number(m[1]),min=m[2],ap=m[3].toUpperCase();
    if(ap==='AM'&&h===12)h=0;
    if(ap==='PM'&&h!==12)h+=12;
    return String(h).padStart(2,'0')+':'+min;
  }
  function humanTime(value){
    var s=String(value||'').trim();
    if(!/^\d{2}:\d{2}$/.test(s))return s;
    var p=s.split(':').map(Number),h=p[0],m=p[1],ap=h>=12?'PM':'AM';
    h=h%12||12;
    return h+':'+String(m).padStart(2,'0')+' '+ap;
  }

  function renderGrades(selected){
    var picked={};
    (selected||[]).forEach(function(g){picked[String(g)]=true;});
    document.getElementById('ftGrades').innerHTML=gradeValues.map(function(g){
      return '<label class="ft-grade-check"><input type="checkbox" value="'+esc(g)+'" '+(picked[g]?'checked':'')+'><span>'+esc(g)+'</span></label>';
    }).join('');
  }

  function updateStaffHint(){
    var count=Object.keys(selectedStaff).filter(function(k){return selectedStaff[k];}).length;
    document.getElementById('ftStaffHint').textContent=count?count+' staff member'+(count===1?'':'s')+' selected.':'Choose the staff members going on the trip.';
  }

  function renderStaff(){
    var list=document.getElementById('ftStaffList');
    var q=String(document.getElementById('ftStaffSearch').value||'').trim().toLowerCase();
    var rows=(S.allStaff||[]).filter(function(s){
      var value=String(s.scheduleName||s.name||'');
      var hay=(String(s.name||value)+' '+String(s.subject||'')).toLowerCase();
      return value&&(!q||hay.indexOf(q)!==-1);
    });
    if(!rows.length){
      list.innerHTML='<div class="hint" style="padding:10px">No matching staff.</div>';
      updateStaffHint();
      return;
    }
    list.innerHTML=rows.map(function(s){
      var value=String(s.scheduleName||s.name||'');
      var label=String(s.name||value);
      var sub=String(s.subject||'');
      return '<label class="ft-staff-row"><input type="checkbox" data-ft-staff="'+esc(value)+'" '+(selectedStaff[value]?'checked':'')+'><span><div class="ft-staff-name">'+esc(label)+'</div>'+(sub?'<div class="ft-staff-sub">'+esc(sub)+'</div>':'')+'</span></label>';
    }).join('');
    updateStaffHint();
  }

  function findEvent(eventOrId){
    if(eventOrId&&typeof eventOrId==='object')return eventOrId;
    var id=String(eventOrId||'');
    return (S.fieldTrips||[]).concat(calendarTrips||[]).find(function(t){return t.eventId===id;})||null;
  }

  window.openFieldTripModal=function(eventOrId){
    var trip=findEvent(eventOrId);
    editingEventId=trip?trip.eventId:'';
    selectedStaff={};
    (trip&&trip.staffNames||[]).forEach(function(name){selectedStaff[name]=true;});

    document.getElementById('fieldTripModalTitle').textContent=trip?'Edit Field Trip':'Add Field Trip';
    document.getElementById('ftName').value=trip?trip.name:'';
    document.getElementById('ftDate').value=trip?trip.date:(S.date||'');
    document.getElementById('ftStart').value=trip?inputTime(trip.start):'09:00';
    document.getElementById('ftEnd').value=trip?inputTime(trip.end):'14:00';
    document.getElementById('ftNotes').value=trip?trip.notes:'';
    document.getElementById('deleteFieldTripBtn').classList.toggle('hidden',!trip);
    renderGrades(trip?trip.grades:[]);
    document.getElementById('ftStaffSearch').value='';
    renderStaff();
    showModal('fieldTripModal');
  };

  async function saveFieldTrip(){
    var grades=Array.from(document.querySelectorAll('#ftGrades input:checked')).map(function(x){return x.value;});
    var staff=Object.keys(selectedStaff).filter(function(k){return selectedStaff[k];});
    var payload={
      eventId:editingEventId,
      name:document.getElementById('ftName').value.trim(),
      date:document.getElementById('ftDate').value,
      start:document.getElementById('ftStart').value,
      end:document.getElementById('ftEnd').value,
      grades:grades,
      staffNames:staff,
      notes:document.getElementById('ftNotes').value.trim()
    };
    try{
      var saved=await gas('webSaveFieldTrip',payload);
      closeModal('fieldTripModal');
      flash((editingEventId?'Field trip updated: ':'Field trip added: ')+(saved.name||'Field Trip')+'.');
      await bootstrap(S.date);
      if(!document.getElementById('calendarModal').classList.contains('hidden')) await loadCalendar();
    }catch(e){fail(e)}
  }

  async function deleteFieldTrip(){
    if(!editingEventId)return;
    try{
      await gas('webDeleteFieldTrip',{eventId:editingEventId});
      closeModal('fieldTripModal');
      flash('Field trip deleted.');
      await bootstrap(S.date);
      if(!document.getElementById('calendarModal').classList.contains('hidden')) await loadCalendar();
    }catch(e){fail(e)}
  }

  function renderFieldTripsInAbsencePanel(){
    var trips=S.fieldTrips||[];
    if(!trips.length)return;
    var list=document.getElementById('absenceList');
    var existing=S.absences.length?list.innerHTML:'';
    var tripHtml=trips.map(function(trip){
      var grades=(trip.grades||[]).join(', ');
      var people=(trip.staffNames||[]).length;
      return '<div class="abs-row field-trip-row"><div class="abs-info"><div class="abs-name">'+esc(trip.name||'Field Trip')+'</div><span class="ft-badge">Field Trip</span><div class="ft-meta">Grades '+esc(grades)+' · '+people+' staff · '+esc(trip.start)+'–'+esc(trip.end)+'</div></div><button class="link-btn" data-edit-fieldtrip="'+esc(trip.eventId)+'">Edit</button></div>';
    }).join('');
    list.innerHTML=tripHtml+existing;
  }

  var baseRenderAbsences=renderAbsences;
  renderAbsences=function(){
    baseRenderAbsences();
    renderFieldTripsInAbsencePanel();
  };

  var baseRenderStats=renderStats;
  renderStats=function(){
    baseRenderStats();
    var names={};
    (S.absences||[]).forEach(function(a){if(a.staffName)names[a.staffName]=true;});
    (S.fieldTrips||[]).forEach(function(t){(t.staffNames||[]).forEach(function(n){if(n)names[n]=true;});});
    var count=Object.keys(names).length;
    document.getElementById('absentCount').textContent=count;
    document.getElementById('absPanelCount').textContent=count;
  };

  function monthLabel(d){
    return d.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  }

  async function loadCalendar(){
    if(!calendarCursor){
      calendarCursor=parseDateKey(S.date)||new Date();
      calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),1,12,0,0,0);
    }
    var first=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),1,12,0,0,0);
    var start=new Date(first.getTime());
    start.setDate(start.getDate()-start.getDay());
    var end=new Date(start.getTime());
    end.setDate(end.getDate()+41);

    document.getElementById('calendarTitle').textContent=monthLabel(first);
    document.getElementById('calendarGrid').innerHTML='<div class="calendar-empty" style="grid-column:1/-1">Loading calendar…</div>';

    try{
      var data=await gas('webGetCalendarData',{startDate:dateKey(start),endDate:dateKey(end)});
      calendarTrips=data.fieldTrips||[];
      renderCalendar(data,start,first.getMonth());
    }catch(e){
      document.getElementById('calendarGrid').innerHTML='<div class="calendar-empty" style="grid-column:1/-1">Calendar could not be loaded.</div>';
      fail(e);
    }
  }

  function renderCalendar(data,start,monthIndex){
    var tripsByDate={},absByDate={};
    (data.fieldTrips||[]).forEach(function(t){(tripsByDate[t.date]||(tripsByDate[t.date]=[])).push(t);});
    (data.absences||[]).forEach(function(a){(absByDate[a.date]||(absByDate[a.date]=[])).push(a);});
    var today=dateKey(new Date());
    var html='';
    for(var i=0;i<42;i++){
      var d=new Date(start.getTime());
      d.setDate(d.getDate()+i);
      var key=dateKey(d);
      var out=d.getMonth()!==monthIndex;
      var classes='calendar-day'+(out?' out':'')+(key===today?' today':'');
      html+='<div class="'+classes+'"><button class="calendar-day-number" data-calendar-date="'+key+'">'+d.getDate()+'</button>';
      (tripsByDate[key]||[]).forEach(function(t){
        var grades=(t.grades||[]).join(',');
        html+='<button class="calendar-event" data-calendar-trip="'+esc(t.eventId)+'">'+esc(t.name||'Field Trip')+(grades?' · '+esc(grades):'')+'</button>';
      });
      var absCount=(absByDate[key]||[]).length;
      if(absCount)html+='<span class="calendar-absence">'+absCount+' absence'+(absCount===1?'':'s')+'</span>';
      html+='</div>';
    }
    document.getElementById('calendarGrid').innerHTML=html;
  }

  function openCalendar(){
    var selected=parseDateKey(S.date)||new Date();
    calendarCursor=new Date(selected.getFullYear(),selected.getMonth(),1,12,0,0,0);
    showModal('calendarModal');
    loadCalendar();
  }

  if(fieldTripButton)fieldTripButton.addEventListener('click',function(){window.openFieldTripModal(null);});
  calendarButton.addEventListener('click',openCalendar);
  document.getElementById('calendarAddTrip').addEventListener('click',function(){window.openFieldTripModal(null);});
  document.getElementById('calendarPrev').addEventListener('click',function(){calendarCursor.setMonth(calendarCursor.getMonth()-1);loadCalendar();});
  document.getElementById('calendarNext').addEventListener('click',function(){calendarCursor.setMonth(calendarCursor.getMonth()+1);loadCalendar();});
  document.getElementById('saveFieldTripBtn').addEventListener('click',saveFieldTrip);
  document.getElementById('deleteFieldTripBtn').addEventListener('click',deleteFieldTrip);
  document.getElementById('ftStaffSearch').addEventListener('input',renderStaff);
  document.getElementById('ftStaffList').addEventListener('change',function(e){
    var box=e.target.closest('[data-ft-staff]');
    if(!box)return;
    selectedStaff[box.dataset.ftStaff]=box.checked;
    updateStaffHint();
  });
  document.getElementById('absenceList').addEventListener('click',function(e){
    var b=e.target.closest('[data-edit-fieldtrip]');
    if(b)window.openFieldTripModal(b.dataset.editFieldtrip);
  });
  document.getElementById('calendarGrid').addEventListener('click',function(e){
    var tripButton=e.target.closest('[data-calendar-trip]');
    if(tripButton){
      var trip=calendarTrips.find(function(t){return t.eventId===tripButton.dataset.calendarTrip;});
      if(trip)window.openFieldTripModal(trip);
      return;
    }
    var dayButton=e.target.closest('[data-calendar-date]');
    if(dayButton){
      closeModal('calendarModal');
      bootstrap(dayButton.dataset.calendarDate);
    }
  });
  document.querySelectorAll('[data-ft-close]').forEach(function(b){
    b.addEventListener('click',function(){closeModal(b.dataset.ftClose);});
  });
  document.getElementById('fieldTripModal').addEventListener('click',function(e){if(e.target===e.currentTarget)closeModal('fieldTripModal');});
  document.getElementById('calendarModal').addEventListener('click',function(e){if(e.target===e.currentTarget)closeModal('calendarModal');});
})();
</script>
`;
}

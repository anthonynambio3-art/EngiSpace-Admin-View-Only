const dateElement=document.getElementById('currentDate');
if(dateElement)dateElement.textContent=new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
const menuToggle=document.getElementById('menuToggle'),sidebar=document.getElementById('sidebar');
if(menuToggle&&sidebar)menuToggle.addEventListener('click',()=>sidebar.classList.toggle('open'));
const page=location.pathname.split('/').pop()||'index.html';
document.querySelectorAll('.nav-link').forEach(a=>{a.classList.toggle('active',a.getAttribute('href')===page);a.addEventListener('click',()=>sidebar?.classList.remove('open'));});
document.getElementById('refreshDashboard')?.addEventListener('click',loadDashboard);
loadDashboard();
async function loadDashboard(){
 const total=document.getElementById('totalClassrooms');if(!total)return;
 const message=document.getElementById('dashboardMessage');if(message)message.textContent='Loading statistics...';
 try{
  const [roomResponse,activeResponse]=await Promise.all([
   fetch('/api/classrooms',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}}),
   fetch('/api/schedules/active',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}})
  ]);
  if(!roomResponse.ok||!activeResponse.ok)throw new Error('Unable to load room statistics.');
  const rooms=await roomResponse.json(),active=await activeResponse.json();
  const knownRoomIds=new Set(rooms.map(room=>String(room.roomId)));
  const occupiedIds=new Set(active.filter(x=>String(x.status).toUpperCase()==='OCCUPIED'&&knownRoomIds.has(String(x.roomId))).map(x=>String(x.roomId)));
  total.textContent=rooms.length;
  document.getElementById('occupiedRooms').textContent=occupiedIds.size;
  document.getElementById('availableRooms').textContent=Math.max(0,rooms.length-occupiedIds.size);
  if(message){message.textContent='';message.className='dashboard-message empty';}
 }catch(error){if(message){message.textContent=error.message;message.className='dashboard-message error';}}
}

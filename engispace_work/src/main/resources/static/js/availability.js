(() => {
    'use strict';
    const ROOM_API = '/api/classrooms';
    const OCCUPANCY_API = '/api/schedules';
    let rooms = [], activeRecords = [], historyRecords = [], currentUser = null;
    let selectedRoom = null, leavingRoomId = null;
    const byId = id => document.getElementById(id);
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const setMessage = message => { const el=byId('pageMessage'); if(el){el.textContent=message;el.style.display=message?'block':'none';} };
    const isLab = room => String(room.roomType || '').toUpperCase() === 'LABORATORY' || String(room.roomName || '').toLowerCase().includes('laboratory');
    const fmt = value => { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); };

    async function requestJson(url, label) {
        let response;
        try {
            response = await fetch(url, { method:'GET', credentials:'same-origin', cache:'no-store', headers:{'Accept':'application/json'} });
        } catch (error) {
            throw new Error(`${label}: Cannot connect to the server. Confirm that Spring Boot is running and open EngiSpace from the same server address.`);
        }
        if (response.status === 401) {
            window.location.href = '/login.html';
            throw new Error('Your login session has expired. Please log in again.');
        }
        if (!response.ok) {
            const detail = (await response.text().catch(() => '')).trim();
            throw new Error(`${label}: HTTP ${response.status}${detail ? ' — ' + detail.slice(0,160) : ''}`);
        }
        const type = response.headers.get('content-type') || '';
        if (!type.toLowerCase().includes('application/json')) {
            const detail = (await response.text().catch(() => '')).slice(0,100);
            throw new Error(`${label}: Expected JSON but received ${type || 'an unknown response'}${detail ? ' (' + detail + ')' : ''}.`);
        }
        return response.json();
    }

    function getActive(roomId) {
        return activeRecords.find(record => String(record.roomId) === String(roomId) && String(record.status).toUpperCase() === 'OCCUPIED');
    }

    function renderRooms() {
        const grid = byId('roomGrid');
        if (!grid) return;
        const query = (byId('roomSearch')?.value || '').trim().toLowerCase();
        const filtered = rooms.filter(room => [room.roomName, room.roomId, room.building, room.floor, room.roomType].some(value => String(value || '').toLowerCase().includes(query)));
        const count = byId('roomCount');
        if (count) count.textContent = `${filtered.length} of ${rooms.length} classroom${rooms.length === 1 ? '' : 's'}`;
        grid.innerHTML = '';
        if (!rooms.length) { grid.innerHTML = '<p>No classrooms have been added yet.</p>'; return; }
        if (!filtered.length) { grid.innerHTML = '<p>No classrooms match your search.</p>'; return; }
        filtered.forEach(room => {
            const active = getActive(room.roomId);
            const mine = active && active.mine;
            const card = document.createElement('article'); card.className = 'room-card';
            const title = document.createElement('h3'); title.textContent = room.roomName || room.roomId;
            const meta = document.createElement('p'); meta.className = 'room-meta'; meta.textContent = `${room.building || 'Building'} · ${room.floor || 'Floor'} · ${isLab(room) ? 'Laboratory' : 'Regular Classroom'}`;
            const status = document.createElement('span'); status.className = `room-status ${active ? 'occupied' : 'vacant'}`; status.textContent = active ? 'Occupied' : 'Vacant';
            const occupant = document.createElement('p'); occupant.className = 'room-meta'; occupant.textContent = active ? `Occupied by: ${active.occupant || 'User'} · Since ${fmt(active.timeIn)}` : 'No active occupant';
            card.append(title, meta, status, occupant);
            // Admins are observers: they can see room status but cannot start or end occupancy.
            if (currentUser?.role !== 'ADMIN') {
                const button = document.createElement('button'); button.type = 'button';
                if (!active) { button.textContent = 'Occupy Room'; button.addEventListener('click', () => openOccupy(room)); }
                else if (mine) { button.textContent = 'Leave Room'; button.addEventListener('click', () => openLeave(room)); }
                else { button.textContent = 'Currently Occupied'; button.disabled = true; }
                card.appendChild(button);
            }
            grid.appendChild(card);
        });
    }

    function renderHistory() {
        const body = byId('myHistory'); if (!body) return;
        const admin = currentUser?.role === 'ADMIN';
        const historyWrap = body.closest('.history-wrap');
        if (admin) { if (historyWrap) historyWrap.style.display = 'none'; return; }
        const heading = historyWrap?.querySelector('h2');
        if (heading) heading.textContent = admin ? 'All Occupancy Records' : 'My Occupancy History';
        body.innerHTML = '';
        const sorted = [...historyRecords].sort((a,b) => String(b.timeIn || '').localeCompare(String(a.timeIn || '')));
        if (!sorted.length) { body.innerHTML = `<tr><td colspan="8">${admin ? 'No occupancy records yet.' : 'You do not have any occupancy records yet.'}</td></tr>`; return; }
        sorted.forEach(record => {
            const room = rooms.find(item => String(item.roomId) === String(record.roomId));
            const row = document.createElement('tr');
            [room?.roomName || record.roomId, `${record.program || '—'} / ${record.section || '—'}`, record.subject || '—', record.purpose || '—', fmt(record.timeIn), fmt(record.timeOut), record.status || '—'].forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); });
            const photo = document.createElement('td');
            if (admin && record.exitPhoto) { const link = document.createElement('a'); link.href = `/api/schedules/proof/${encodeURIComponent(record.exitPhoto)}`; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'View photo'; photo.appendChild(link); }
            else photo.textContent = record.exitPhoto ? 'Submitted' : '—';
            row.appendChild(photo); body.appendChild(row);
        });
    }

    async function loadRoomData() {
        const grid = byId('roomGrid'), history = byId('myHistory'), count = byId('roomCount');
        if (grid) grid.innerHTML = '<p>Loading classrooms...</p>';
        if (history) history.innerHTML = '<tr><td colspan="8">Loading occupancy history...</td></tr>';
        if (count) count.textContent = 'Loading classrooms...';
        setMessage('Connecting to the EngiSpace server...');
        try {
            currentUser = await requestJson('/api/auth/me', 'Account verification');
            // Load each data source independently so one failed request does not hide the others.
            const results = await Promise.allSettled([
                requestJson(ROOM_API, 'Classroom list'),
                requestJson(`${OCCUPANCY_API}/active`, 'Active room status'),
                requestJson(currentUser.role === 'ADMIN' ? OCCUPANCY_API : `${OCCUPANCY_API}/mine`, 'Occupancy history')
            ]);
            const errors = [];
            if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) rooms = results[0].value;
            else { rooms = []; errors.push(results[0].status === 'rejected' ? results[0].reason.message : 'Classroom list returned an unexpected data format.'); }
            if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) activeRecords = results[1].value;
            else { activeRecords = []; errors.push(results[1].status === 'rejected' ? results[1].reason.message : 'Active room status returned an unexpected data format.'); }
            if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) historyRecords = results[2].value;
            else { historyRecords = []; errors.push(results[2].status === 'rejected' ? results[2].reason.message : 'Occupancy history returned an unexpected data format.'); }
            renderRooms(); renderHistory();
            setMessage(errors.length ? `Some information could not be loaded: ${errors.join(' | ')}` : '');
        } catch (error) {
            console.error('EngiSpace Room Availability error:', error);
            if (grid) grid.innerHTML = `<p class="error-text">${esc(error.message || 'Unable to load classrooms.')}</p>`;
            if (history) history.innerHTML = `<tr><td colspan="8" class="error-text">${esc(error.message || 'Unable to load occupancy history.')}</td></tr>`;
            if (count) count.textContent = 'Unable to load';
            setMessage(error.message || 'Unable to connect. Check the browser Console and Network tabs.');
        }
    }

    function openOccupy(room) {
        if (currentUser?.role === 'ADMIN') return;
        selectedRoom = room; byId('occupyTitle').textContent = 'Occupy Room';
        byId('occupyRoomLabel').textContent = `${room.roomName || room.roomId} · ${isLab(room) ? 'Laboratory' : 'Regular Classroom'}`;
        byId('occupyForm').reset(); byId('occupyError').textContent = '';
        const lab = isLab(room); byId('instructor').required = lab; byId('subject').required = lab;
        byId('instructorRequiredNote').textContent = lab ? '(required for laboratories)' : '(optional)';
        byId('subjectRequiredNote').textContent = lab ? '(required for laboratories)' : '(optional)';
        byId('occupyModal').classList.add('open');
    }
    function closeOccupy() { byId('occupyModal').classList.remove('open'); selectedRoom = null; }
    function openLeave(room) { if (currentUser?.role === 'ADMIN') return; leavingRoomId = room.roomId; byId('leaveRoomLabel').textContent = `${room.roomName || room.roomId}: upload a photo showing the classroom after cleaning.`; byId('leaveForm').reset(); byId('leaveError').textContent = ''; byId('leaveModal').classList.add('open'); }
    function closeLeave() { byId('leaveModal').classList.remove('open'); leavingRoomId = null; }

    byId('occupyForm')?.addEventListener('submit', async event => {
        event.preventDefault(); if (currentUser?.role === 'ADMIN' || !selectedRoom) return;
        const payload = { roomId:selectedRoom.roomId, program:byId('program').value.trim(), section:byId('section').value.trim(), instructor:byId('instructor').value.trim(), subject:byId('subject').value.trim(), purpose:byId('purpose').value.trim() };
        try {
            const response = await fetch(`${OCCUPANCY_API}/occupy`, { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(payload) });
            const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || `Unable to occupy classroom (HTTP ${response.status}).`);
            closeOccupy(); await loadRoomData(); setMessage('Occupancy started. Time In was recorded automatically.');
        } catch (error) { byId('occupyError').textContent = error.message; }
    });
    byId('leaveForm')?.addEventListener('submit', async event => {
        event.preventDefault(); if (currentUser?.role === 'ADMIN' || !leavingRoomId) return;
        const photo = byId('exitPhoto').files[0]; if (!photo) { byId('leaveError').textContent = 'Please select a classroom photo.'; return; }
        const form = new FormData(); form.append('roomId', leavingRoomId); form.append('proof', photo);
        try {
            const response = await fetch(`${OCCUPANCY_API}/leave`, { method:'POST', credentials:'same-origin', body:form });
            const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || `Unable to complete exit (HTTP ${response.status}).`);
            closeLeave(); await loadRoomData(); setMessage('Photo submitted. Time Out was recorded and the classroom is now vacant.');
        } catch (error) { byId('leaveError').textContent = error.message; }
    });
    byId('cancelOccupy')?.addEventListener('click', closeOccupy);
    byId('cancelLeave')?.addEventListener('click', closeLeave);
    byId('refreshRooms')?.addEventListener('click', loadRoomData);
    byId('roomSearch')?.addEventListener('input', renderRooms);
    loadRoomData();
})();

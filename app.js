// ================= نظام إدارة الجلسة وصلاحيات المستخدم (LocalStorage) =================
let sessionUser = JSON.parse(localStorage.getItem('pharmacy_session')) || null;

let teamData = JSON.parse(localStorage.getItem('pharmacy_team')) || {
    requests: [],
    members: [
        { id: 'mem_admin', name: 'المدير العام', phone: '07800000000', role: 'مدير', isManager: true, permissions: { viewPrices: true, editStock: true, returns: true, settings: true } }
    ]
};

// فحص حالة الجلسة فور تحميل التطبيق
function checkAuthSession() {
    const authScreen = document.getElementById('auth-screen');
    
    if (!sessionUser) {
        authScreen.classList.remove('hidden');
    } else {
        authScreen.classList.add('hidden');
        applyUserPermissions();
    }
}

// تبديل نماذج شاشة البداية
function showAdminLogin() {
    document.getElementById('auth-main-options').classList.add('hidden');
    document.getElementById('admin-login-box').classList.remove('hidden');
}
function hideAdminLogin() {
    document.getElementById('admin-login-box').classList.add('hidden');
    document.getElementById('auth-main-options').classList.remove('hidden');
}
function showJoinRequestForm() {
    document.getElementById('auth-main-options').classList.add('hidden');
    document.getElementById('join-request-box').classList.remove('hidden');
}
function hideJoinRequestForm() {
    document.getElementById('join-request-box').classList.add('hidden');
    document.getElementById('auth-main-options').classList.remove('hidden');
}

// التحقق من رمز المدير PIN (الافتراضي 1234)
function verifyAdminPin() {
    let pin = document.getElementById('admin-pin-input').value;
    if (pin === '1234') {
        sessionUser = { name: 'المدير العام', role: 'مدير', isManager: true, permissions: { viewPrices: true, editStock: true, returns: true, settings: true } };
        localStorage.setItem('pharmacy_session', JSON.stringify(sessionUser));
        document.getElementById('auth-screen').classList.add('hidden');
        checkAuthSession();
        showModal('مرحباً بك', 'تم تسجيل دخول المدير بنجاح.');
    } else {
        showModal('خطأ', 'رمز PIN غير صحيح. الرمز الافتراضي هو 1234');
    }
}

// إرسال طلب انضمام موظف جديد
function submitJoinRequest() {
    let name = document.getElementById('req-name-input').value.trim();
    let phone = document.getElementById('req-phone-input').value.trim();
    
    if(!name || !phone) {
        showModal('تنبيه', 'يرجى إدخال الاسم ورقم الهاتف.');
        return;
    }
    
    let newReq = { id: 'req_' + Date.now(), name, phone, role: 'مساعد صيدلي' };
    teamData.requests.push(newReq);
    localStorage.setItem('pharmacy_team', JSON.stringify(teamData));
    
    // حفظ مؤقت برقم الهاتف لكي نتحقق من حالة القبول لاحقاً
    localStorage.setItem('pending_phone', phone);
    
    document.getElementById('join-request-box').classList.add('hidden');
    document.getElementById('pending-approval-box').classList.remove('hidden');
}

// فحص هل تمت الموافقة على الطلب المعلق
function checkPendingApproval() {
    let phone = localStorage.getItem('pending_phone');
    teamData = JSON.parse(localStorage.getItem('pharmacy_team')) || teamData;
    
    let approvedMember = teamData.members.find(m => m.phone === phone);
    if(approvedMember) {
        sessionUser = approvedMember;
        localStorage.setItem('pharmacy_session', JSON.stringify(sessionUser));
        localStorage.removeItem('pending_phone');
        document.getElementById('auth-screen').classList.add('hidden');
        checkAuthSession();
        showModal('تمت الموافقة', 'أهلاً بك في فريق العمل!');
    } else {
        showModal('قيد الانتظار', 'لم تتم الموافقة بعد من قبل المدير. يرجى الانتظار.');
    }
}

// تسجيل خروج الجهاز
function logoutDevice() {
    showConfirm('تأكيد الخروج', 'هل أنت متأكد من تسجيل الخروج من هذا الجهاز؟', () => {
        localStorage.removeItem('pharmacy_session');
        location.reload();
    });
}

// تطبيق الصلاحيات على واجهة المستخدم
function applyUserPermissions() {
    let userInfoEl = document.getElementById('sidebar-user-info');
    if(userInfoEl) userInfoEl.innerText = `المستخدم: ${sessionUser.name} (${sessionUser.role})`;
    
    // إذا لم يكن مديراً، يمكن إخفاء أو تقييد أزرار معينة بناءً على sessionUser.permissions
    if(!sessionUser.isManager && sessionUser.permissions) {
        // مثال: إذا لم يمتلك صلاحية الإعدادات يمكن إخفاؤها
    }
}

// ================= إدارة القائمة الجانبية (Hamburger) =================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    
    if (sidebar.classList.contains('sidebar-closed')) {
        sidebar.classList.remove('sidebar-closed');
        sidebar.classList.add('sidebar-open');
        backdrop.classList.remove('hidden');
    } else {
        sidebar.classList.remove('sidebar-open');
        sidebar.classList.add('sidebar-closed');
        backdrop.classList.add('hidden');
    }
}

// ================= تبديل التبويبات =================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('bg-teal-100', 'text-teal-800', 'border-r-4', 'border-teal-600');
    });
    
    let activeBtn = document.getElementById('btn-' + tabId);
    if(activeBtn) {
        activeBtn.classList.add('bg-teal-100', 'text-teal-800', 'border-r-4', 'border-teal-600');
    }
    
    if (!document.getElementById('sidebar').classList.contains('sidebar-closed')) {
        toggleSidebar();
    }
    
    if(tabId === 'team-tab') renderTeam();
}

// فتح الإعدادات (مع فحص صلاحية المدير)
function openSettingsModal() {
    if(sessionUser && (sessionUser.isManager || sessionUser.permissions?.settings)) {
        openModal('settings-modal');
    } else {
        showModal('صلاحية مرفوضة', 'عذراً، ليس لديك صلاحية الدخول للإعدادات.');
    }
}

// ================= نظام فريق العمل والصلاحيات (للمدير) =================
function renderTeam() {
    const requestsContainer = document.getElementById('join-requests-container');
    const membersTbody = document.getElementById('team-members-tbody');
    const teamBadge = document.getElementById('team-badge');
    const requestsSection = document.getElementById('manager-requests-section');
    
    // إذا كان المستخدم موظفاً وليس مديراً، نخفي عنه قسم قبول الطلبات
    if(sessionUser && !sessionUser.isManager) {
        if(requestsSection) requestsSection.classList.add('hidden');
    }

    teamData = JSON.parse(localStorage.getItem('pharmacy_team')) || teamData;

    if(teamData.requests.length > 0 && sessionUser?.isManager) {
        teamBadge.innerText = teamData.requests.length;
        teamBadge.classList.remove('hidden');
    } else {
        teamBadge.classList.add('hidden');
    }

    requestsContainer.innerHTML = '';
    if(teamData.requests.length === 0) {
        requestsContainer.innerHTML = '<p class="text-slate-500 text-sm">لا توجد طلبات انضمام معلقة.</p>';
    } else {
        teamData.requests.forEach(req => {
            requestsContainer.innerHTML += `
                <div class="flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <div>
                        <div class="font-bold text-slate-800">${req.name}</div>
                        <div class="text-xs text-slate-500">هاتف: ${req.phone}</div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="approveRequest('${req.id}')" class="bg-teal-600 text-white px-3 py-1 rounded font-bold hover:bg-teal-700 text-sm">قبول</button>
                        <button onclick="rejectRequest('${req.id}')" class="bg-red-100 text-red-700 px-3 py-1 rounded font-bold hover:bg-red-200 text-sm">رفض</button>
                    </div>
                </div>
            `;
        });
    }

    membersTbody.innerHTML = '';
    teamData.members.forEach(member => {
        let actionBtn = member.isManager || !sessionUser?.isManager
            ? '<span class="text-slate-400 text-sm">صلاحيات كاملة</span>' 
            : `<button onclick="openPermissions('${member.id}')" class="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100 text-sm font-bold">⚙️ الصلاحيات</button>`;
            
        membersTbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-3 font-bold text-slate-800">${member.name}</td>
                <td class="p-3 text-slate-600">${member.phone || '-'}</td>
                <td class="p-3"><span class="${member.isManager ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'} px-2 py-1 rounded text-sm">${member.role}</span></td>
                <td class="p-3 text-center">${actionBtn}</td>
            </tr>
        `;
    });
}

function approveRequest(reqId) {
    let reqIndex = teamData.requests.findIndex(r => r.id === reqId);
    if(reqIndex > -1) {
        let user = teamData.requests[reqIndex];
        teamData.members.push({
            id: 'mem_' + Date.now(),
            name: user.name,
            phone: user.phone,
            role: user.role,
            isManager: false,
            permissions: { viewPrices: false, editStock: false, returns: false, settings: false }
        });
        teamData.requests.splice(reqIndex, 1);
        localStorage.setItem('pharmacy_team', JSON.stringify(teamData));
        renderTeam();
        showModal('نجاح', `تم قبول الموظف ${user.name}.`);
    }
}

function rejectRequest(reqId) {
    teamData.requests = teamData.requests.filter(r => r.id !== reqId);
    localStorage.setItem('pharmacy_team', JSON.stringify(teamData));
    renderTeam();
}

function openPermissions(memberId) {
    let member = teamData.members.find(m => m.id === memberId);
    if(!member) return;
    
    document.getElementById('perm-user-id').value = member.id;
    document.getElementById('perm-user-name').innerText = member.name;
    document.getElementById('perm-view-prices').checked = member.permissions.viewPrices;
    document.getElementById('perm-edit-stock').checked = member.permissions.editStock;
    document.getElementById('perm-returns').checked = member.permissions.returns;
    document.getElementById('perm-settings').checked = member.permissions.settings;
    
    document.getElementById('permissions-modal').classList.remove('hidden');
}

function savePermissions() {
    let memberId = document.getElementById('perm-user-id').value;
    let member = teamData.members.find(m => m.id === memberId);
    
    if(member) {
        member.permissions.viewPrices = document.getElementById('perm-view-prices').checked;
        member.permissions.editStock = document.getElementById('perm-edit-stock').checked;
        member.permissions.returns = document.getElementById('perm-returns').checked;
        member.permissions.settings = document.getElementById('perm-settings').checked;
        
        localStorage.setItem('pharmacy_team', JSON.stringify(teamData));
        closeModal('permissions-modal');
        showModal('نجاح', 'تم حفظ صلاحيات الموظف.');
    }
}

// ================= النوافذ المنبثقة المساعدة =================
function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('custom-modal').classList.remove('hidden');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
function showConfirm(title, message, callback) {
    // يمكن ربطها بنافذة تأكيد مخصصة أو استخدام الـ confirm التقليدية نظراً للاختصار
    if(confirm(message)) callback();
}

// التهيئة عند فتح التطبيق
document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession(); // التحقق من تسجيل الدخول والانضمام
    switchTab('pos-tab'); // واجهة نقطة البيع الافتتاحية
    renderTeam();
    
    const now = new Date();
    if(document.getElementById('inv-date')) {
        document.getElementById('inv-date').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }
});

// ================= النوافذ المنبثقة (Modals) =================
function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('custom-modal').classList.remove('hidden');
}

function openModal(modalId) {
    if(modalId === 'alerts-modal') checkAlerts(); 
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) { 
    document.getElementById(modalId).classList.add('hidden'); 
}

// نافذة التأكيد الذكية البديلة لـ confirm المتصفح
let confirmActionCallback = null;
function showConfirm(title, message, callback) {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    confirmActionCallback = callback;
    document.getElementById('confirm-modal').classList.remove('hidden');
}

document.getElementById('confirm-action-btn').addEventListener('click', () => {
    closeModal('confirm-modal');
    if (confirmActionCallback) confirmActionCallback();
});

// ================= تبديل التبويبات =================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-teal-900'); btn.classList.add('hover:bg-teal-600');
    });
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById('btn-' + tabId).classList.remove('hover:bg-teal-600');
    document.getElementById('btn-' + tabId).classList.add('bg-teal-900');
    
    if(tabId === 'inventory-tab') renderInventory();
}

// ================= الإعدادات =================
let appSettings = {
    pharmacyName: 'صيدلية الديوان',
    address: 'العنوان',
    phone: '0780000000',
    defaultLowStock: 3,
    defaultExpMonths: 6
};

function loadSettings() {
    let saved = JSON.parse(localStorage.getItem('pharmacy_settings'));
    if(saved) appSettings = { ...appSettings, ...saved };
    
    document.getElementById('setup-pharmacy-name').value = appSettings.pharmacyName;
    document.getElementById('setup-address').value = appSettings.address;
    document.getElementById('setup-phone').value = appSettings.phone;
    document.getElementById('setup-low-stock').value = appSettings.defaultLowStock;
    document.getElementById('setup-exp-months').value = appSettings.defaultExpMonths;

    document.getElementById('inv-pharmacy-name').value = appSettings.pharmacyName;
    document.getElementById('inv-address').value = appSettings.address;
    document.getElementById('inv-phone').value = appSettings.phone;

    document.getElementById('entry-low-stock').value = appSettings.defaultLowStock;
    document.getElementById('entry-exp-alert').value = appSettings.defaultExpMonths;
}

function saveSettings() {
    appSettings.pharmacyName = document.getElementById('setup-pharmacy-name').value;
    appSettings.address = document.getElementById('setup-address').value;
    appSettings.phone = document.getElementById('setup-phone').value;
    appSettings.defaultLowStock = document.getElementById('setup-low-stock').value;
    appSettings.defaultExpMonths = document.getElementById('setup-exp-months').value;
    
    localStorage.setItem('pharmacy_settings', JSON.stringify(appSettings));
    loadSettings(); 
    closeModal('settings-modal');
    showModal('نجاح', 'تم حفظ إعدادات التطبيق بنجاح، وتم تحديث الفاتورة.');
}

// ================= التنبيهات =================
function checkAlerts() {
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    let alertCount = 0;

    const currentDate = new Date();
    
    inventory.forEach(item => {
        const lowStockLimit = parseFloat(item.lowStock) || appSettings.defaultLowStock;
        const currentQty = parseFloat(item.qty) || 0;
        
        if(currentQty <= lowStockLimit) {
            alertCount++;
            container.innerHTML += `
                <div class="bg-orange-50 border-r-4 border-orange-500 p-4 rounded-lg mb-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h4 class="font-bold text-orange-800">تنبيه نقص كمية</h4>
                        <p class="text-orange-700 text-sm">${item.name} - الكمية الحالية: ${currentQty} ${item.unit}</p>
                    </div>
                    <button onclick="openEditModal('${item.barcode}'); closeModal('alerts-modal')" class="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-bold hover:bg-orange-200">تعديل المخزون</button>
                </div>
            `;
        }

        if(item.expiry) {
            const expDate = new Date(item.expiry + "-01");
            const monthsDiff = (expDate.getFullYear() - currentDate.getFullYear()) * 12 + (expDate.getMonth() - currentDate.getMonth());
            const expLimit = parseFloat(item.expAlert) || appSettings.defaultExpMonths;
            
            if(monthsDiff <= expLimit) {
                alertCount++;
                container.innerHTML += `
                    <div class="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg mb-4 flex justify-between items-center shadow-sm">
                        <div>
                            <h4 class="font-bold text-red-800">تحذير نفاذ صلاحية</h4>
                            <p class="text-red-700 text-sm">${item.name} - ينفذ في: ${item.expiry}</p>
                        </div>
                    </div>
                `;
            }
        }
    });

    if(alertCount === 0) container.innerHTML = '<p class="text-center text-slate-500 font-bold mt-10">لا توجد تنبيهات حالياً.</p>';
    document.getElementById('alerts-badge').innerText = alertCount;
}

// الإعدادات الأولية
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    const now = new Date();
    document.getElementById('inv-date').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    renderInventory();
    calculateTotal();
    checkAlerts();
});

// ================= الكاميرا الذكية =================
let html5QrCode;
let currentTargetInput = null;
let currentCameraAction = null; 

function openCamera(targetInputId, action) {
    currentTargetInput = targetInputId;
    currentCameraAction = action; 
    document.getElementById('reader-container').classList.remove('hidden');
    
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    
    html5QrCode.start(
        { facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            closeCamera();
            if (currentTargetInput) {
                let inputEl = document.getElementById(currentTargetInput);
                inputEl.value = decodedText;
                if(currentCameraAction === 'fetch') fetchMedicineForPOS(decodedText);
                if(currentCameraAction === 'search') inputEl.dispatchEvent(new Event('keyup'));
            }
        },
        (errorMessage) => { }
    ).catch(err => { closeCamera(); showModal('خطأ', 'يرجى إعطاء صلاحية الكاميرا.'); });
}
function closeCamera() {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(console.error);
    document.getElementById('reader-container').classList.add('hidden');
}

// ================= إدارة المخزون والإدخال =================
function saveMedicine() {
    const data = {
        barcode: document.getElementById('entry-barcode').value,
        name: document.getElementById('entry-name').value,
        scientific: document.getElementById('entry-scientific').value,
        common: document.getElementById('entry-common').value,
        unit: document.getElementById('entry-unit').value,
        qty: document.getElementById('entry-qty').value,
        price: document.getElementById('entry-price').value,
        expiry: document.getElementById('entry-expiry').value,
        supplier: document.getElementById('entry-supplier').value,
        supplierDate: document.getElementById('entry-supplier-date').value,
        supplierInv: document.getElementById('entry-supplier-inv').value,
        lowStock: document.getElementById('entry-low-stock').value,
        expAlert: document.getElementById('entry-exp-alert').value
    };

    if(!data.barcode || !data.name || !data.price) { showModal('تنبيه', 'الباركود، الاسم التجاري والسعر حقول أساسية.'); return; }

    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let existingIndex = inventory.findIndex(i => i.barcode === data.barcode);
    
    if(existingIndex >= 0) inventory[existingIndex] = data;
    else inventory.push(data);
    
    localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
    showModal('نجاح', 'تم حفظ الدواء في المخزون.');
    
    ['entry-barcode','entry-name','entry-scientific','entry-common','entry-qty','entry-price','entry-expiry', 'entry-supplier', 'entry-supplier-date', 'entry-supplier-inv'].forEach(id => document.getElementById(id).value = '');
    checkAlerts();
}

function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    
    const searchTerm = document.getElementById('search-inventory').value.toLowerCase();
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;

    let filtered = inventory.filter(item => {
        const matchText = (item.name?.toLowerCase().includes(searchTerm) || 
                           item.scientific?.toLowerCase().includes(searchTerm) || 
                           item.common?.toLowerCase().includes(searchTerm) || 
                           item.barcode?.includes(searchTerm));
        
        let matchDate = true;
        if(dateFrom && item.expiry) matchDate = matchDate && (item.expiry >= dateFrom);
        if(dateTo && item.expiry) matchDate = matchDate && (item.expiry <= dateTo);
        return matchText && matchDate;
    });

    tbody.innerHTML = '';
    filtered.forEach(item => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-2">${item.barcode}</td>
                <td class="p-2 font-bold text-teal-800">${item.name}</td>
                <td class="p-2">${item.unit}</td>
                <td class="p-2 font-bold">${item.qty}</td>
                <td class="p-2">${item.price} د.ع.</td>
                <td class="p-2 text-center whitespace-nowrap">
                    <button onclick="openEditModal('${item.barcode}')" class="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 text-sm ml-1">تعديل</button>
                    <button onclick="deleteFromInventory('${item.barcode}')" class="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 text-sm">حذف</button>
                </td>
            </tr>
        `;
    });
}

function deleteFromInventory(barcode) {
    showConfirm('تأكيد الحذف', 'هل أنت متأكد من حذف هذا الدواء نهائياً من المخزن؟', () => {
        let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
        inventory = inventory.filter(i => i.barcode !== barcode);
        localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
        renderInventory();
        checkAlerts();
        showModal('نجاح', 'تم حذف الدواء بنجاح.');
    });
}

// ================= نافذة التعديل =================
function openEditModal(barcode) {
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let item = inventory.find(i => i.barcode === barcode);
    if(!item) return;

    document.getElementById('edit-barcode').value = item.barcode;
    document.getElementById('edit-name').value = item.name || '';
    document.getElementById('edit-scientific').value = item.scientific || '';
    document.getElementById('edit-common').value = item.common || '';
    document.getElementById('edit-unit').value = item.unit || 'باكيت';
    document.getElementById('edit-qty').value = item.qty || '';
    document.getElementById('edit-price').value = item.price || '';
    document.getElementById('edit-expiry').value = item.expiry || '';
    document.getElementById('edit-supplier').value = item.supplier || '';
    document.getElementById('edit-supplier-date').value = item.supplierDate || '';
    document.getElementById('edit-supplier-inv').value = item.supplierInv || '';
    document.getElementById('edit-low-stock').value = item.lowStock || appSettings.defaultLowStock;
    document.getElementById('edit-exp-alert').value = item.expAlert || appSettings.defaultExpMonths;

    openModal('edit-modal');
}

function saveEditedMedicine() {
    const barcode = document.getElementById('edit-barcode').value;
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let index = inventory.findIndex(i => i.barcode === barcode);
    
    if(index >= 0) {
        inventory[index] = {
            barcode: barcode,
            name: document.getElementById('edit-name').value,
            scientific: document.getElementById('edit-scientific').value,
            common: document.getElementById('edit-common').value,
            unit: document.getElementById('edit-unit').value,
            qty: document.getElementById('edit-qty').value,
            price: document.getElementById('edit-price').value,
            expiry: document.getElementById('edit-expiry').value,
            supplier: document.getElementById('edit-supplier').value,
            supplierDate: document.getElementById('edit-supplier-date').value,
            supplierInv: document.getElementById('edit-supplier-inv').value,
            lowStock: document.getElementById('edit-low-stock').value,
            expAlert: document.getElementById('edit-exp-alert').value
        };
        localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
        renderInventory();
        closeModal('edit-modal');
        showModal('نجاح', 'تم حفظ التعديلات بنجاح.');
        checkAlerts();
    }
}

// ================= نقطة البيع والفاتورة =================
function fetchMedicineForPOS(searchTerm) {
    if(!searchTerm) return;
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let item = inventory.find(i => i.barcode === searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if(item) {
        document.getElementById('pos-name').value = item.name;
        document.getElementById('pos-unit').value = item.unit;
        document.getElementById('pos-price').value = item.price;
        document.getElementById('pos-qty').value = 1;
    } else {
        showModal('تنبيه', 'لم يتم العثور على الدواء في المخزن!');
        document.getElementById('pos-name').value = '';
        document.getElementById('pos-price').value = '';
    }
}

function addItemToInvoice() {
    const name = document.getElementById('pos-name').value;
    const unit = document.getElementById('pos-unit').value;
    const qty = parseFloat(document.getElementById('pos-qty').value) || 1;
    const price = parseFloat(document.getElementById('pos-price').value) || 0;

    if(!name) { showModal('تنبيه', 'يرجى تحديد الدواء أولاً.'); return; }

    const tbody = document.getElementById('invoice-tbody');
    const total = qty * price;

    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-200 hover:bg-slate-50 transition";
    tr.innerHTML = `
        <td class="p-2"><input type="text" value="${name}" readonly class="editable-input font-semibold text-slate-800 outline-none w-full"></td>
        <td class="p-2">
            <select class="editable-input bg-white w-full">
                <option value="باكيت" ${unit==='باكيت'?'selected':''}>باكيت</option>
                <option value="شريط" ${unit==='شريط'?'selected':''}>شريط</option>
                <option value="حبة" ${unit==='حبة'?'selected':''}>حبة</option>
                <option value="فيال" ${unit==='فيال'?'selected':''}>فيال</option>
                <option value="امبول" ${unit==='امبول'?'selected':''}>امبول</option>
                <option value="قطعة" ${unit==='قطعة'?'selected':''}>قطعة</option>
            </select>
        </td>
        <td class="p-2"><input type="number" value="${qty}" step="0.25" class="editable-input text-center qty-input w-full" onchange="updateRowTotal(this)"></td>
        <td class="p-2"><input type="number" value="${price}" class="editable-input price-input w-full" onchange="updateRowTotal(this)"></td>
        <td class="p-2 font-bold text-teal-700 row-total-display whitespace-nowrap">${total} د.ع.</td>
        <td class="p-2 text-center no-print"><button onclick="this.closest('tr').remove(); calculateTotal();" class="text-red-500 font-bold hover:text-red-700">✖</button></td>
    `;
    
    tbody.appendChild(tr);
    
    document.getElementById('pos-barcode').value = '';
    document.getElementById('pos-name').value = '';
    document.getElementById('pos-price').value = '';
    
    calculateTotal();
}

function updateRowTotal(element) {
    const tr = element.closest('tr');
    const qty = parseFloat(tr.querySelector('.qty-input').value) || 0;
    const price = parseFloat(tr.querySelector('.price-input').value) || 0;
    tr.querySelector('.row-total-display').innerText = (qty * price) + ' د.ع.';
    calculateTotal();
}

function calculateTotal() {
    let grandTotal = 0;
    document.querySelectorAll('#invoice-tbody tr').forEach(tr => {
        const qty = parseFloat(tr.querySelector('.qty-input').value) || 0;
        const price = parseFloat(tr.querySelector('.price-input').value) || 0;
        grandTotal += (qty * price);
    });
    document.getElementById('final-total').innerText = grandTotal;
}

function clearInvoice() {
    showConfirm('تفريغ الفاتورة', 'هل أنت متأكد من مسح جميع المواد المحضرة في الفاتورة الحالية؟', () => {
        document.getElementById('invoice-tbody').innerHTML = '';
        calculateTotal();
    });
}

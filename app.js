// إدارة النوافذ المنبثقة
function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('custom-modal').classList.remove('hidden');
}
function closeModal(modalId) { 
    document.getElementById(modalId).classList.add('hidden'); 
}

// تبديل التبويبات
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('bg-teal-50');
    });
    document.getElementById(tabId).classList.remove('hidden');
    
    if(tabId === 'inventory-tab' && typeof renderInventory === 'function') renderInventory();
}

// ================= الإعدادات الافتراضية =================
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
    
    if(document.getElementById('setup-pharmacy-name')) document.getElementById('setup-pharmacy-name').value = appSettings.pharmacyName;
    if(document.getElementById('setup-address')) document.getElementById('setup-address').value = appSettings.address;
    if(document.getElementById('setup-phone')) document.getElementById('setup-phone').value = appSettings.phone;

    if(document.getElementById('inv-pharmacy-name')) document.getElementById('inv-pharmacy-name').value = appSettings.pharmacyName;
    if(document.getElementById('inv-address')) document.getElementById('inv-address').value = appSettings.address;
}

function saveSettings() {
    appSettings.pharmacyName = document.getElementById('setup-pharmacy-name').value;
    appSettings.address = document.getElementById('setup-address').value;
    appSettings.phone = document.getElementById('setup-phone').value;
    
    localStorage.setItem('pharmacy_settings', JSON.stringify(appSettings));
    loadSettings(); 
    showModal('نجاح', 'تم حفظ إعدادات التطبيق بنجاح.');
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    const now = new Date();
    if(document.getElementById('inv-date')) document.getElementById('inv-date').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if(typeof renderInventory === 'function') renderInventory();
    calculateTotal();
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
                if(currentCameraAction === 'search') {
                    inputEl.dispatchEvent(new Event('keyup'));
                }
            }
        },
        (errorMessage) => { }
    ).catch(err => { closeCamera(); showModal('خطأ', 'يرجى إعطاء صلاحية الكاميرا.'); });
}

function closeCamera() {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(console.error);
    document.getElementById('reader-container').classList.add('hidden');
}

// ================= إدارة المخزون =================
function saveMedicine() {
    const data = {
        barcode: document.getElementById('entry-barcode').value,
        name: document.getElementById('entry-name').value,
        price: document.getElementById('entry-price').value
    };

    if(!data.barcode || !data.name || !data.price) { showModal('تنبيه', 'الباركود، الاسم والسعر حقول أساسية.'); return; }

    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let existingIndex = inventory.findIndex(i => i.barcode === data.barcode);
    
    if(existingIndex >= 0) inventory[existingIndex] = data;
    else inventory.push(data);
    
    localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
    showModal('نجاح', 'تم حفظ الدواء في المخزون.');
}

// ================= نقطة البيع والفاتورة =================
function fetchMedicineForPOS(searchTerm) {
    if(!searchTerm) return;
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    
    let item = inventory.find(i => i.barcode === searchTerm || (i.name && i.name.toLowerCase().includes(searchTerm.toLowerCase())));
    
    if(item) {
        if(document.getElementById('pos-name')) document.getElementById('pos-name').value = item.name;
        if(document.getElementById('pos-price')) document.getElementById('pos-price').value = item.price;
        if(document.getElementById('pos-qty')) document.getElementById('pos-qty').value = 1;
    } else {
        showModal('تنبيه', 'لم يتم العثور على الدواء في المخزن!');
    }
}

function addItemToInvoice() {
    const name = document.getElementById('pos-name') ? document.getElementById('pos-name').value : '';
    const qty = document.getElementById('pos-qty') ? parseFloat(document.getElementById('pos-qty').value) || 1 : 1;
    const price = document.getElementById('pos-price') ? parseFloat(document.getElementById('pos-price').value) || 0 : 0;

    if(!name) { showModal('تنبيه', 'يرجى تحديد الدواء أولاً.'); return; }

    const tbody = document.getElementById('invoice-tbody');
    const total = qty * price;

    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-200 hover:bg-slate-50 transition";
    tr.innerHTML = `
        <td class="p-2"><input type="text" value="${name}" readonly class="editable-input font-semibold text-slate-800 outline-none w-full"></td>
        <td class="p-2">
            <select class="editable-input bg-white w-full">
                <option value="باكيت">باكيت</option>
            </select>
        </td>
        <td class="p-2"><input type="number" value="${qty}" step="0.25" class="editable-input text-center qty-input w-full" onchange="updateRowTotal(this)"></td>
        <td class="p-2"><input type="number" value="${price}" class="editable-input price-input w-full" onchange="updateRowTotal(this)"></td>
        <td class="p-2 font-bold text-teal-700 row-total-display whitespace-nowrap">${total} د.ع.</td>
        <td class="p-2 text-center no-print"><button onclick="this.closest('tr').remove(); calculateTotal();" class="text-red-500 font-bold hover:text-red-700">✖</button></td>
    `;
    
    if(tbody) tbody.appendChild(tr);
    
    if(document.getElementById('pos-barcode')) document.getElementById('pos-barcode').value = '';
    if(document.getElementById('pos-name')) document.getElementById('pos-name').value = '';
    if(document.getElementById('pos-price')) document.getElementById('pos-price').value = '';
    
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
    if(document.getElementById('final-total')) document.getElementById('final-total').innerText = grandTotal;
}

function clearInvoice() {
    if(document.getElementById('invoice-tbody')) document.getElementById('invoice-tbody').innerHTML = '';
    calculateTotal();
}

// ================= النوافذ المنبثقة =================
function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('custom-modal').classList.remove('hidden');
}

function openModal(modalId) {
    if(modalId === 'alerts-modal') checkAlerts(); 
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

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

// ================= التنقل =================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-teal-900'); btn.classList.add('hover:bg-teal-600');
    });
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById('btn-' + tabId).classList.remove('hover:bg-teal-600');
    document.getElementById('btn-' + tabId).classList.add('bg-teal-900');
    
    if(tabId === 'inventory-tab') renderInventory();
    if(tabId === 'returns-tab') renderReturnsLog();
    if(tabId === 'invoices-log-tab') { populateSupplierFilter(); renderSupplierInvoices(); }
}

// ================= الإعدادات =================
let appSettings = { pharmacyName: 'صيدلية الديوان', address: '', phone: '', defaultLowStock: 3, defaultExpMonths: 6 };

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
    loadSettings(); closeModal('settings-modal'); showModal('نجاح', 'تم حفظ الإعدادات.');
}

// ================= الحسابات الذكية (شراء - ربح - بيع) =================
function calcSellPrice(prefix) {
    let buy = parseFloat(document.getElementById(`${prefix}-purchase-price`).value) || 0;
    let margin = parseFloat(document.getElementById(`${prefix}-profit-margin`).value) || 0;
    let sellEl = document.getElementById(`${prefix}-price`);
    if(buy > 0 && margin > 0) {
        let sell = buy + (buy * (margin / 100));
        sellEl.value = Math.round(sell); // تقريب للدينار العراقي
    }
}
function calcMargin(prefix) {
    let buy = parseFloat(document.getElementById(`${prefix}-purchase-price`).value) || 0;
    let sell = parseFloat(document.getElementById(`${prefix}-price`).value) || 0;
    let marginEl = document.getElementById(`${prefix}-profit-margin`);
    if(buy > 0 && sell > buy) {
        let margin = ((sell - buy) / buy) * 100;
        marginEl.value = margin.toFixed(2);
    } else { marginEl.value = ''; }
}

// ================= الكاميرا الذكية =================
let html5QrCode; let currentTargetInput = null; let currentCameraAction = null; 

function openCamera(targetInputId, action) {
    currentTargetInput = targetInputId; currentCameraAction = action; 
    document.getElementById('reader-container').classList.remove('hidden');
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            closeCamera();
            if (currentTargetInput) {
                let inputEl = document.getElementById(currentTargetInput); inputEl.value = decodedText;
                if(currentCameraAction === 'fetch') fetchMedicineForPOS(decodedText);
                if(currentCameraAction === 'search') inputEl.dispatchEvent(new Event('keyup'));
                if(currentCameraAction === 'return-fetch') fetchReturnItem(decodedText);
            }
        }, (errorMessage) => { }
    ).catch(err => { closeCamera(); showModal('خطأ', 'يرجى إعطاء صلاحية الكاميرا.'); });
}
function closeCamera() {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(console.error);
    document.getElementById('reader-container').classList.add('hidden');
}

// ================= الإدخال والمخزون =================
function saveMedicine() {
    const data = {
        barcode: document.getElementById('entry-barcode').value,
        name: document.getElementById('entry-name').value,
        scientific: document.getElementById('entry-scientific').value,
        common: document.getElementById('entry-common').value,
        unit: document.getElementById('entry-unit').value,
        qty: document.getElementById('entry-qty').value,
        purchasePrice: document.getElementById('entry-purchase-price').value,
        profitMargin: document.getElementById('entry-profit-margin').value,
        price: document.getElementById('entry-price').value,
        expiry: document.getElementById('entry-expiry').value,
        supplier: document.getElementById('entry-supplier').value,
        supplierDate: document.getElementById('entry-supplier-date').value,
        supplierInv: document.getElementById('entry-supplier-inv').value,
        lowStock: document.getElementById('entry-low-stock').value,
        expAlert: document.getElementById('entry-exp-alert').value
    };

    if(!data.barcode || !data.name || !data.price || !data.purchasePrice) { 
        showModal('تنبيه', 'الباركود، الاسم التجاري، سعر الشراء وسعر البيع حقول أساسية.'); return; 
    }

    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let existingIndex = inventory.findIndex(i => i.barcode === data.barcode);
    if(existingIndex >= 0) inventory[existingIndex] = data; else inventory.push(data);
    localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
    
    updateSupplierInvoicesDB(data); // تحديث فواتير المذاخر
    
    showModal('نجاح', 'تم الحفظ بنجاح.');
    ['entry-barcode','entry-name','entry-scientific','entry-common','entry-qty','entry-purchase-price','entry-profit-margin','entry-price','entry-expiry','entry-supplier','entry-supplier-date','entry-supplier-inv'].forEach(id => document.getElementById(id).value = '');
    checkAlerts();
}

function updateSupplierInvoicesDB(item) {
    if(!item.supplier || !item.supplierInv) return;
    let sInvs = JSON.parse(localStorage.getItem('supplier_invoices_db')) || [];
    let totalLine = (parseFloat(item.qty)||0) * (parseFloat(item.purchasePrice)||0);
    
    let idx = sInvs.findIndex(i => i.supplier === item.supplier && i.invNum === item.supplierInv);
    if(idx >= 0) { sInvs[idx].total += totalLine; }
    else { sInvs.push({ supplier: item.supplier, invNum: item.supplierInv, date: item.supplierDate, total: totalLine, statementChecked: false }); }
    localStorage.setItem('supplier_invoices_db', JSON.stringify(sInvs));
}

function renderInventory() {
    const tbody = document.getElementById('inventory-tbody');
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    const searchTerm = document.getElementById('search-inventory').value.toLowerCase();
    
    let filtered = inventory.filter(item => (item.name?.toLowerCase().includes(searchTerm) || item.barcode?.includes(searchTerm)));
    tbody.innerHTML = '';
    filtered.forEach(item => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-2">${item.barcode}</td><td class="p-2 font-bold text-teal-800">${item.name}</td>
                <td class="p-2">${item.unit}</td><td class="p-2 font-bold">${item.qty}</td>
                <td class="p-2 text-slate-500">${item.purchasePrice||0} د.ع.</td><td class="p-2 font-bold">${item.price} د.ع.</td>
                <td class="p-2 text-center whitespace-nowrap">
                    <button onclick="openEditModal('${item.barcode}')" class="bg-blue-100 text-blue-700 px-2 py-1 rounded">تعديل</button>
                    <button onclick="deleteFromInventory('${item.barcode}')" class="bg-red-100 text-red-700 px-2 py-1 rounded">حذف</button>
                </td>
            </tr>
        `;
    });
}
function deleteFromInventory(barcode) {
    showConfirm('تأكيد الحذف', 'هل أنت متأكد من حذف الدواء؟', () => {
        let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
        inventory = inventory.filter(i => i.barcode !== barcode);
        localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
        renderInventory(); checkAlerts();
    });
}

function openEditModal(barcode) {
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let item = inventory.find(i => i.barcode === barcode);
    if(!item) return;

    ['barcode','name','scientific','common','unit','qty','purchasePrice','profitMargin','price','expiry','supplier','supplierDate','supplierInv','lowStock','expAlert'].forEach(field => {
        let el = document.getElementById('edit-' + (field==='supplierDate'?'supplier-date':field==='supplierInv'?'supplier-inv':field.replace(/([A-Z])/g, '-$1').toLowerCase()));
        if(el) el.value = item[field] || '';
    });
    if(!document.getElementById('edit-low-stock').value) document.getElementById('edit-low-stock').value = appSettings.defaultLowStock;
    if(!document.getElementById('edit-exp-alert').value) document.getElementById('edit-exp-alert').value = appSettings.defaultExpMonths;
    openModal('edit-modal');
}
function saveEditedMedicine() {
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let index = inventory.findIndex(i => i.barcode === document.getElementById('edit-barcode').value);
    if(index >= 0) {
        let item = inventory[index];
        item.name = document.getElementById('edit-name').value;
        item.qty = document.getElementById('edit-qty').value;
        item.purchasePrice = document.getElementById('edit-purchase-price').value;
        item.price = document.getElementById('edit-price').value;
        // ... (تحديث باقي الحقول)
        localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
        renderInventory(); closeModal('edit-modal'); showModal('نجاح', 'تم التعديل.');
    }
}

// ================= المردود إلى المذخر =================
let currentScannedItemForReturn = null;
function fetchReturnItem(barcode) {
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    currentScannedItemForReturn = inventory.find(i => i.barcode === barcode);
    if(currentScannedItemForReturn) {
        document.getElementById('ret-name').value = currentScannedItemForReturn.name;
        document.getElementById('ret-price').value = currentScannedItemForReturn.purchasePrice || 0;
        
        // جلب المذاخر من الفواتير المحفوظة أو من المادة نفسها
        let sInvs = JSON.parse(localStorage.getItem('supplier_invoices_db')) || [];
        let suppliers = [...new Set(sInvs.map(i => i.supplier))]; // استخراج المذاخر الفريدة
        if(currentScannedItemForReturn.supplier && !suppliers.includes(currentScannedItemForReturn.supplier)) suppliers.push(currentScannedItemForReturn.supplier);
        
        let supSelect = document.getElementById('ret-supplier');
        supSelect.innerHTML = '<option value="">-- اختر المذخر --</option>';
        suppliers.forEach(s => { if(s) supSelect.innerHTML += `<option value="${s}">${s}</option>`; });
        
        // اختيار المذخر الافتراضي للمادة
        if(currentScannedItemForReturn.supplier) {
            supSelect.value = currentScannedItemForReturn.supplier;
            populateReturnInvoices(); // تعبئة الفواتير
        }
    } else { showModal('تنبيه', 'لم يتم العثور على المادة.'); }
}

function populateReturnInvoices() {
    let supplier = document.getElementById('ret-supplier').value;
    let sInvs = JSON.parse(localStorage.getItem('supplier_invoices_db')) || [];
    let invSelect = document.getElementById('ret-supplier-inv');
    invSelect.innerHTML = '<option value="">-- اختر الفاتورة --</option>';
    
    sInvs.filter(i => i.supplier === supplier).forEach(inv => {
        invSelect.innerHTML += `<option value="${inv.invNum}" data-date="${inv.date}">${inv.invNum}</option>`;
    });
    // إضافة الفاتورة الحالية للمادة كخيار احتياطي إذا لم تكن مسجلة
    if(currentScannedItemForReturn && currentScannedItemForReturn.supplier === supplier && currentScannedItemForReturn.supplierInv) {
        if(!sInvs.find(i => i.invNum === currentScannedItemForReturn.supplierInv)) {
            invSelect.innerHTML += `<option value="${currentScannedItemForReturn.supplierInv}" data-date="${currentScannedItemForReturn.supplierDate}">${currentScannedItemForReturn.supplierInv}</option>`;
        }
        invSelect.value = currentScannedItemForReturn.supplierInv;
        fillReturnInvDate();
    }
}

function fillReturnInvDate() {
    let select = document.getElementById('ret-supplier-inv');
    let option = select.options[select.selectedIndex];
    if(option && option.dataset.date) document.getElementById('ret-supplier-date').value = option.dataset.date;
}

function calcReturnTotal(prefix) {
    let qty = parseFloat(document.getElementById(`${prefix}-qty`).value) || 0;
    let price = parseFloat(document.getElementById(`${prefix}-price`).value) || 0;
    document.getElementById(`${prefix}-total`).value = (qty * price) + " د.ع.";
}

function saveReturnEntry() {
    const data = {
        id: Date.now().toString(), barcode: document.getElementById('ret-barcode').value,
        name: document.getElementById('ret-name').value, supplier: document.getElementById('ret-supplier').value,
        supplierInv: document.getElementById('ret-supplier-inv').value, supplierDate: document.getElementById('ret-supplier-date').value,
        qty: document.getElementById('ret-qty').value, price: document.getElementById('ret-price').value,
        total: parseFloat(document.getElementById('ret-qty').value) * parseFloat(document.getElementById('ret-price').value),
        retInv: document.getElementById('ret-inv').value, retDate: document.getElementById('ret-date').value
    };
    if(!data.name || !data.qty || !data.supplier) { showModal('تنبيه', 'يرجى إكمال الحقول الأساسية للإرجاع.'); return; }

    let returns = JSON.parse(localStorage.getItem('returns_db')) || [];
    returns.push(data); localStorage.setItem('returns_db', JSON.stringify(returns));
    showModal('نجاح', 'تم تسجيل المردود.');
    renderReturnsLog();
    ['ret-barcode','ret-name','ret-supplier','ret-supplier-inv','ret-supplier-date','ret-qty','ret-price','ret-inv','ret-date'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ret-total').value = "0 د.ع.";
}

function renderReturnsLog() {
    const tbody = document.getElementById('returns-tbody');
    let returns = JSON.parse(localStorage.getItem('returns_db')) || [];
    tbody.innerHTML = '';
    returns.forEach(item => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50">
                <td class="p-2 font-bold">${item.name}</td><td class="p-2">${item.supplier}</td><td class="p-2">${item.supplierInv}</td>
                <td class="p-2 font-bold">${item.qty}</td><td class="p-2">${item.price}</td><td class="p-2 text-red-600 font-bold">${item.total}</td>
                <td class="p-2">${item.retInv || '-'}</td>
                <td class="p-2 text-center"><button onclick="openReturnEditModal('${item.id}')" class="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold text-xs">تعديل</button></td>
            </tr>
        `;
    });
}

function openReturnEditModal(id) {
    let returns = JSON.parse(localStorage.getItem('returns_db')) || [];
    let item = returns.find(i => i.id === id);
    if(item) {
        document.getElementById('edit-ret-id').value = item.id;
        document.getElementById('edit-ret-name').value = item.name;
        document.getElementById('edit-ret-supplier').value = item.supplier;
        document.getElementById('edit-ret-supplier-inv').value = item.supplierInv;
        document.getElementById('edit-ret-supplier-date').value = item.supplierDate;
        document.getElementById('edit-ret-qty').value = item.qty;
        document.getElementById('edit-ret-price').value = item.price;
        document.getElementById('edit-ret-inv').value = item.retInv;
        document.getElementById('edit-ret-date').value = item.retDate;
        calcReturnTotal('edit-ret');
        openModal('edit-return-modal');
    }
}
function saveEditedReturn() {
    let id = document.getElementById('edit-ret-id').value;
    let returns = JSON.parse(localStorage.getItem('returns_db')) || [];
    let idx = returns.findIndex(i => i.id === id);
    if(idx >= 0) {
        returns[idx].supplier = document.getElementById('edit-ret-supplier').value;
        returns[idx].qty = document.getElementById('edit-ret-qty').value;
        returns[idx].price = document.getElementById('edit-ret-price').value;
        returns[idx].total = parseFloat(returns[idx].qty) * parseFloat(returns[idx].price);
        // ... (باقي الحقول)
        localStorage.setItem('returns_db', JSON.stringify(returns));
        renderReturnsLog(); closeModal('edit-return-modal'); showModal('نجاح','تم التعديل.');
    }
}

// ================= فواتير المذاخر =================
function populateSupplierFilter() {
    let sInvs = JSON.parse(localStorage.getItem('supplier_invoices_db')) || [];
    let suppliers = [...new Set(sInvs.map(i => i.supplier))].filter(Boolean);
    let select = document.getElementById('sup-inv-supplier');
    select.innerHTML = '<option value="">الكل</option>';
    suppliers.forEach(s => select.innerHTML += `<option value="${s}">${s}</option>`);
}

function renderSupplierInvoices() {
    const tbody = document.getElementById('supplier-invoices-tbody');
    let sInvs = JSON.parse(localStorage.getItem('supplier_invoices_db')) || [];
    
    let monthFilter = document.getElementById('sup-inv-month').value; // YYYY-MM
    let supFilter = document.getElementById('sup-inv-supplier').value;

    let filtered = sInvs.filter(i => {
        let mMatch = true; let sMatch = true;
        if(monthFilter && i.date) mMatch = i.date.startsWith(monthFilter);
        if(supFilter) sMatch = (i.supplier === supFilter);
        return mMatch && sMatch;
    });

    tbody.innerHTML = '';
    filtered.forEach((inv, index) => {
        // إنشاء مؤشر فريد
        let uid = inv.supplier + '_' + inv.invNum;
        tbody.innerHTML += `
            <tr class="border-b hover:bg-teal-50 transition">
                <td class="p-3 font-bold text-slate-800">${inv.supplier}</td><td class="p-3">${inv.invNum}</td><td class="p-3">${inv.date||'-'}</td>
                <td class="p-3 font-black text-teal-700">${inv.total} د.ع.</td>
                <td class="p-3 text-center">
                    <button onclick="toggleStatement('${inv.supplier}', '${inv.invNum}')" class="px-3 py-1 rounded font-bold border ${inv.statementChecked ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-400 border-slate-300'}">
                        ${inv.statementChecked ? '✔️ مستلم' : 'استلام؟'}
                    </button>
                </td>
            </tr>
        `;
    });
}
function toggleStatement(supplier, invNum) {
    let sInvs = JSON.parse(localStorage.getItem('supplier_invoices_db')) || [];
    let idx = sInvs.findIndex(i => i.supplier === supplier && i.invNum === invNum);
    if(idx >= 0) {
        sInvs[idx].statementChecked = !sInvs[idx].statementChecked;
        localStorage.setItem('supplier_invoices_db', JSON.stringify(sInvs));
        renderSupplierInvoices();
    }
}

// ================= الفاتورة والمبيعات =================
function fetchMedicineForPOS(searchTerm) { /* ... نفس الكود السابق الخاص بالفاتورة ... */ }
function addItemToInvoice() { /* ... نفس الكود السابق ... */ }
function calculateTotal() { /* ... نفس الكود السابق ... */ }
function clearInvoice() { /* ... نفس الكود السابق ... */ }

// التهيئة الأولية
document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); checkAlerts();
    const now = new Date(); document.getElementById('inv-date').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
});

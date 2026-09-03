// إدارة النوافذ المنبثقة
function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('custom-modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('custom-modal').classList.add('hidden'); }

// تبديل التبويبات
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

// إعداد التاريخ
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    document.getElementById('inv-date').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    renderInventory();
    calculateTotal();
});

// ================= الكاميرا =================
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
            if (currentTargetInput) document.getElementById(currentTargetInput).value = decodedText;
            
            // إذا كنا في نقطة البيع، نقوم بالبحث فوراً
            if(currentCameraAction === 'fetch') {
                fetchMedicineForPOS(decodedText);
            }
        },
        (errorMessage) => { }
    ).catch(err => { closeCamera(); showModal('خطأ', 'يرجى إعطاء صلاحية الكاميرا للمتصفح.'); });
}
function closeCamera() {
    if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(console.error);
    document.getElementById('reader-container').classList.add('hidden');
}

// ================= التخزين المحلي (المخزون) =================
function saveMedicine() {
    const barcode = document.getElementById('entry-barcode').value;
    const name = document.getElementById('entry-name').value;
    const unit = document.getElementById('entry-unit').value;
    const qty = document.getElementById('entry-qty').value;
    const price = document.getElementById('entry-price').value;
    const expiry = document.getElementById('entry-expiry').value;

    if(!barcode || !name || !price) { showModal('تنبيه', 'الباركود، الاسم والسعر حقول إلزامية.'); return; }

    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let existingIndex = inventory.findIndex(i => i.barcode === barcode);
    
    if(existingIndex >= 0) {
        inventory[existingIndex] = { barcode, name, unit, qty, price, expiry };
    } else {
        inventory.push({ barcode, name, unit, qty, price, expiry });
    }
    
    localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
    showModal('نجاح', 'تم حفظ الدواء في المخزون المحلي بنجاح.');
    
    // تفريغ الحقول
    ['entry-barcode','entry-name','entry-qty','entry-price','entry-expiry'].forEach(id => document.getElementById(id).value = '');
}

function renderInventory(searchTerm = '') {
    const tbody = document.getElementById('inventory-tbody');
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    
    if(searchTerm) {
        inventory = inventory.filter(i => i.name.includes(searchTerm) || i.barcode.includes(searchTerm));
    }

    tbody.innerHTML = '';
    inventory.forEach(item => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50">
                <td class="p-2">${item.barcode}</td>
                <td class="p-2 font-bold">${item.name}</td>
                <td class="p-2">${item.unit}</td>
                <td class="p-2">${item.qty}</td>
                <td class="p-2">${item.price} د.ع</td>
                <td class="p-2 text-red-500 cursor-pointer hover:font-bold" onclick="deleteFromInventory('${item.barcode}')">حذف</td>
            </tr>
        `;
    });
}

function deleteFromInventory(barcode) {
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    inventory = inventory.filter(i => i.barcode !== barcode);
    localStorage.setItem('my_pharmacy_db', JSON.stringify(inventory));
    renderInventory();
}

// ================= نقطة البيع والفاتورة =================
function fetchMedicineForPOS(barcode) {
    let inventory = JSON.parse(localStorage.getItem('my_pharmacy_db')) || [];
    let item = inventory.find(i => i.barcode === barcode);
    
    if(item) {
        document.getElementById('pos-name').value = item.name;
        document.getElementById('pos-unit').value = item.unit;
        document.getElementById('pos-price').value = item.price;
        document.getElementById('pos-qty').value = 1; // إعادة العدد لـ 1 افتراضياً
    } else {
        showModal('تنبيه', 'لم يتم العثور على الدواء في المخزن! تأكد من إدخاله أولاً في تبويب الإدخال.');
        document.getElementById('pos-name').value = '';
        document.getElementById('pos-price').value = '';
    }
}

function addItemToInvoice() {
    const name = document.getElementById('pos-name').value;
    const unit = document.getElementById('pos-unit').value;
    const qty = parseFloat(document.getElementById('pos-qty').value);
    const price = parseFloat(document.getElementById('pos-price').value);

    if(!name) { showModal('تنبيه', 'يرجى مسح أو إدخال الباركود أولاً.'); return; }

    const tbody = document.getElementById('invoice-tbody');
    const total = qty * price;

    // إضافة سطر جديد للفاتورة بخصائص التعديل اليدوي
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-200 hover:bg-slate-50 transition group";
    tr.innerHTML = `
        <td class="p-2"><input type="text" value="${name}" readonly class="editable-input font-semibold text-slate-800 cursor-not-allowed outline-none"></td>
        <td class="p-2">
            <select class="editable-input bg-white">
                <option value="باكيت" ${unit==='باكيت'?'selected':''}>باكيت</option>
                <option value="شريط" ${unit==='شريط'?'selected':''}>شريط</option>
                <option value="حبة" ${unit==='حبة'?'selected':''}>حبة</option>
                <option value="فيال" ${unit==='فيال'?'selected':''}>فيال</option>
                <option value="امبول" ${unit==='امبول'?'selected':''}>امبول</option>
            </select>
        </td>
        <td class="p-2"><input type="number" value="${qty}" step="0.25" class="editable-input text-center qty-input" onchange="updateRowTotal(this)"></td>
        <td class="p-2"><input type="number" value="${price}" class="editable-input price-input" onchange="updateRowTotal(this)"></td>
        <td class="p-2 font-bold text-teal-700 row-total-display">${total} د.ع</td>
        <td class="p-2 text-center no-print"><button onclick="this.closest('tr').remove(); calculateTotal();" class="text-red-500 font-bold hover:text-red-700">✖</button></td>
    `;
    
    tbody.appendChild(tr);
    
    // تفريغ حقل الباركود للاستعداد للدواء التالي
    document.getElementById('pos-barcode').value = '';
    document.getElementById('pos-name').value = '';
    document.getElementById('pos-price').value = '';
    
    calculateTotal();
    showModal('نجاح', 'تمت الإضافة للفاتورة بنجاح. يمكنك معاينتها في تبويب الفاتورة.');
}

function updateRowTotal(element) {
    const tr = element.closest('tr');
    const qty = parseFloat(tr.querySelector('.qty-input').value) || 0;
    const price = parseFloat(tr.querySelector('.price-input').value) || 0;
    tr.querySelector('.row-total-display').innerText = (qty * price) + ' د.ع';
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
    document.getElementById('invoice-tbody').innerHTML = '';
    calculateTotal();
}

// إدارة النوافذ المنبثقة الاحترافية (Custom Modals بديل لـ alert)
function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    const modal = document.getElementById('custom-modal');
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('custom-modal').classList.add('hidden');
}

// تبديل التبويبات بسلاسة
function switchTab(tabId) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    // إعادة ألوان الأزرار للوضع الطبيعي
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-teal-900');
        btn.classList.add('hover:bg-teal-600');
    });
    
    // إظهار التبويب المطلوب
    document.getElementById(tabId).classList.remove('hidden');
    // تفعيل لون الزر النشط
    const activeBtn = document.getElementById('btn-' + tabId);
    activeBtn.classList.remove('hover:bg-teal-600');
    activeBtn.classList.add('bg-teal-900');
}

// إعداد التاريخ والوقت التلقائي (لكنه قابل للتعديل يدوياً)
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    
    // تنسيق التاريخ YYYY-MM-DD لحقل الـ date
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    document.getElementById('inv-date').value = `${yyyy}-${mm}-${dd}`;
    
    // تنسيق الوقت HH:MM لحقل الـ time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('inv-time').value = `${hours}:${minutes}`;
});

// نظام الكاميرا وقراءة الباركود والـ QR Code
let html5QrCode;
let currentTargetInput = null; // متغير لحفظ الحقل المراد تعبئته بالرقم

function openCamera(targetInputId) {
    currentTargetInput = targetInputId; // تحديد الحقل الهدف
    const readerContainer = document.getElementById('reader-container');
    readerContainer.classList.remove('hidden');
    
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    
    html5QrCode.start(
        { facingMode: "environment" }, // الكاميرا الخلفية دائماً
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            closeCamera();
            // إدراج النص المقروء في الحقل المحدد تلقائياً
            if (currentTargetInput) {
                document.getElementById(currentTargetInput).value = decodedText;
            }
            showModal('تمت القراءة بنجاح', `تم إدراج الرمز: ${decodedText}`);
        },
        (errorMessage) => { /* تجاهل الأخطاء الصامتة أثناء محاولة التركيز */ }
    ).catch(err => {
        closeCamera();
        showModal('خطأ', 'يرجى إعطاء صلاحية الكاميرا للمتصفح.');
    });
}

function closeCamera() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
    }
    document.getElementById('reader-container').classList.add('hidden');
}

// اختصارات الكيبورد للكمبيوتر (احترافية وسرعة بالعمل)
document.addEventListener('keydown', function(event) {
    if (event.key === 'F2') {
        event.preventDefault();
        switchTab('pos-tab');
    }
    if (event.key === 'F4') {
        event.preventDefault();
        window.print();
    }
});

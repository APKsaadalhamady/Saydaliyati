// تحديد تاريخ الفاتورة التلقائي
document.addEventListener('DOMContentLoaded', () => {
    const dateElement = document.getElementById('invoice-date');
    if(dateElement){
        const now = new Date();
        dateElement.innerText = `التاريخ: ${now.toLocaleDateString('ar-IQ')} - الوقت: ${now.toLocaleTimeString('ar-IQ')}`;
    }
});

// دالة التبديل بين التبويبات (الفاتورة / المخزن)
function switchTab(tabName) {
    document.getElementById('pos-tab').classList.add('hidden');
    document.getElementById('inventory-tab').classList.add('hidden');
    
    if(tabName === 'pos') {
        document.getElementById('pos-tab').classList.remove('hidden');
    } else if (tabName === 'inventory') {
        document.getElementById('inventory-tab').classList.remove('hidden');
    }
}

// إعداد كاميرا الباركود باستخدام html5-qrcode
const startCameraBtn = document.getElementById('start-camera');
let html5QrCode;

if(startCameraBtn) {
    startCameraBtn.addEventListener('click', () => {
        const readerDiv = document.getElementById('reader');
        readerDiv.classList.remove('hidden');
        
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }
        
        html5QrCode.start(
            { facingMode: "environment" }, // الكاميرا الخلفية
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                // عند نجاح مسح الباركود
                alert("تم قراءة الباركود: " + decodedText + "\n(سيتم استدعاء الدواء من الفايربيز وإضافته للفاتورة)");
                html5QrCode.stop();
                readerDiv.classList.add('hidden');
            },
            (errorMessage) => {
                // التجاهل أثناء البحث عن باركود
            }
        ).catch((err) => {
            console.error("خطأ في تشغيل الكاميرا", err);
            alert("يرجى إعطاء صلاحية الكاميرا للمتصفح");
        });
    });
}

# نموذج تسجيل سحب البضاعة

## 1) إنشاء Google Sheet

أنشئ Google Sheet جديد، مثلاً:
"سجل سحب البضاعة"

لا تحتاج إلى إنشاء الأعمدة يدوياً. الكود سينشئ Sheet باسم:
Records

أول مرة يتم إرسال عملية، سيُنشئ العناوين تلقائياً.

## 2) وضع كود Google Apps Script

داخل Google Sheet:
Extensions > Apps Script

احذف أي كود موجود والصق كامل محتوى الملف:
apps-script.gs

ثم Save.

## 3) نشر Apps Script

من Apps Script:
Deploy > New deployment

اختر:
Web app

الإعدادات:
- Execute as: Me
- Who has access: Anyone

اضغط Deploy.

انسخ Web app URL الذي ينتهي غالباً بـ:
.../exec

## 4) ضع الرابط في الموقع

افتح:
script.js

ابحث عن:

const GOOGLE_SCRIPT_URL = "ضع_رابط_Apps_Script_هنا";

واستبدله بالرابط الذي نسخته، مثال:

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";

## 5) المستخدمون

حالياً الرموز:

A أو a = A
M أو m = M
B أو b = B
H أو h = H

لتغييرها إلى أسماء حقيقية، عدّل الجزء التالي في apps-script.gs:

const USERS = {
  "A": "اسم الشخص الأول",
  "M": "اسم الشخص الثاني",
  "B": "اسم الشخص الثالث",
  "H": "اسم الشخص الرابع"
};

المستخدم يكتب الرمز، والاسم الموجود بعده هو الذي سيُسجل في Google Sheets.

## 6) طريقة الاستخدام

1. يفتح المستخدم الصفحة.
2. يدخل A أو M أو B أو H.
3. يدخل اسم الزبون.
4. يكتب عدد القطع لكل صنف.
5. يضغط "عرض التقسيم".
6. مثال:
   40 Red
   سيظهر:
   40 قطعة = 2 علبة + 4 قطع
7. إذا كانت الأرقام صحيحة، يضغط:
   "حفظ في Google Sheets"
8. تُحفظ العملية في صف واحد، مع:
   - التاريخ والوقت
   - المستخدم
   - الزبون
   - كمية القطع
   - عدد العلب
   - القطع المتبقية
   لكل صنف.

## 7) الملفات

- index.html = واجهة النموذج
- style.css = التصميم والموبايل
- script.js = المنطق والاتصال بـ Google Sheets
- apps-script.gs = كود Google Apps Script

ملاحظة:
كلمة المرور هنا هي رمز وصول بسيط، وليست نظام حسابات أمني متقدم. لكن التحقق النهائي من المستخدم يتم داخل Apps Script وليس فقط داخل JavaScript في الصفحة.

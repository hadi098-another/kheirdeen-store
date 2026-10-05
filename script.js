const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzUWWDoPsGM8wET_BIoLd2SdoCLodmAfTR2sA89CuH5BYJsY-BkRqRnRsjPeSrtUKuP/exec";


const ITEMS = [

  {
    id: "red",
    name: "Red",
    arabic: "أحمر",
    group: "sandwich",
    pack: 18,
    color: "#e53935",
    aliases: [
      "red",
      "احمر",
      "أحمر"
    ]
  },

  {
    id: "cheese",
    name: "Cheese",
    arabic: "جبنة",
    group: "sandwich",
    pack: 24,
    color: "#f5c400",
    aliases: [
      "cheese",
      "جبنة",
      "جبنه"
    ]
  },

  {
    id: "chocolate",
    name: "Chocolate",
    arabic: "شوكولا",
    group: "sandwich",
    pack: 24,
    color: "#222222",
    aliases: [
      "chocolate",
      "شوكولا",
      "شوكولاته"
    ]
  },

  {
    id: "creama",
    name: "Creama",
    arabic: "كريما",
    group: "sandwich",
    pack: 24,
    color: "#3f7ee8",
    aliases: [
      "creama",
      "كريما"
    ]
  },

  {
    id: "peacon",
    name: "Peacon",
    arabic: "بيكان",
    group: "sandwich",
    pack: 24,
    color: "#f28c28",
    aliases: [
      "peacon",
      "pekan",
      "بيكان",
      "بيكون"
    ]
  },

  {
    id: "zaatar",
    name: "Zaatar",
    arabic: "زعتر",
    group: "sandwich",
    pack: 30,
    color: "#35a853",
    aliases: [
      "zaatar",
      "زعتر"
    ]
  },

  {
    id: "strawberry",
    name: "Strawberry",
    arabic: "فراولة",
    group: "sandwich",
    pack: 24,
    color: "#ec5aa0",
    aliases: [
      "strawberry",
      "strawberries",
      "فراولة",
      "فريز"
    ]
  },

  {
    id: "vanilla",
    name: "Cookies Vanilla",
    arabic: "كوكيز فانيلا",
    group: "cookies",
    pack: 20,
    color: "#e8d7b5",
    aliases: [
      "cookies vanilla",
      "cookie vanilla",
      "vanilla cookies",
      "كوكيز فانيلا",
      "كوكيز فانيليا",
      "فانيلا"
    ]
  },

  {
    id: "cookieChocolate",
    name: "Cookies Chocolate",
    arabic: "كوكيز شوكولا",
    group: "cookies",
    pack: 20,
    color: "#5a3825",
    aliases: [
      "cookies chocolate",
      "cookie chocolate",
      "chocolate cookies",
      "كوكيز شوكولا",
      "كوكيز شوكولاته"
    ]
  }

];


let currentUser = "";

let currentPassword = "";

let reviewCustomers = [];

let fastParsedQuantities = null;


const $ = id =>
  document.getElementById(id);



/* =================================
   MESSAGE
================================= */

function setMessage(
  element,
  text,
  type = ""
) {

  if (!element) {
    return;
  }

  element.textContent = text;

  element.className =
    "message" +
    (
      type
        ? " " + type
        : ""
    );

}



/* =================================
   ESCAPE HTML
================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}



/* =================================
   GOOGLE API
================================= */

async function postToGoogle(data) {

  if (
    !GOOGLE_SCRIPT_URL ||
    GOOGLE_SCRIPT_URL.includes("ضع_رابط")
  ) {

    throw new Error(
      "رابط Google Apps Script غير موجود."
    );

  }


  console.log(
    "Sending to Google:",
    data
  );


  let response;


  try {

    response =
      await fetch(
        GOOGLE_SCRIPT_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            JSON.stringify(data)
        }
      );

  } catch (error) {

    console.error(
      "FETCH ERROR:",
      error
    );

    throw new Error(
      "تعذر الاتصال بـ Google Apps Script."
    );

  }


  if (!response.ok) {

    throw new Error(
      "Google Apps Script HTTP Error: " +
      response.status
    );

  }


  const text =
    await response.text();


  console.log(
    "Google response:",
    text
  );


  let result;


  try {

    result =
      JSON.parse(text);

  } catch (error) {

    console.error(
      "JSON ERROR:",
      error
    );

    throw new Error(
      "Google Apps Script لم يرجع استجابة صحيحة."
    );

  }


  if (!result.success) {

    throw new Error(
      result.message ||
      "حدث خطأ من Google Apps Script."
    );

  }


  return result;

}



/* =================================
   SCREEN CONTROL
================================= */

function hideAllScreens() {

  const screens = [
    "loginScreen",
    "menuScreen",
    "formScreen",
    "fastPasteScreen",
    "reviewScreen",
    "reportScreen"
  ];

  screens.forEach(id => {

    const element = $(id);

    if (element) {
      element.classList.add("hidden");
    }

  });

}



/* =================================
   MENU
================================= */

function showMenu() {

  hideAllScreens();

  $("menuUser").textContent =
    currentUser;

  $("menuScreen")
    .classList
    .remove("hidden");

}



/* =================================
   ADD NEW
================================= */

function showForm() {

  hideAllScreens();

  resetStockForm();

  $("currentUser").textContent =
    currentUser;

  $("formScreen")
    .classList
    .remove("hidden");

  setTimeout(
    () =>
      $("customer").focus(),
    50
  );

}



/* =================================
   A4 REPORT
================================= */

function showReport() {

  hideAllScreens();

  $("reportUser").textContent =
    currentUser;

  $("reportContent").innerHTML =
    "";

  setMessage(
    $("reportMsg"),
    "جاري تحميل التقرير..."
  );

  $("reportScreen")
    .classList
    .remove("hidden");

  loadReport();

}



/*
  Return all report products
  in the same order as ITEMS.
*/

function getReportItems() {

  return ITEMS.filter(
    item =>
      item.group === "sandwich" ||
      item.group === "cookies"
  );

}



/*
  Normalize product names.
*/

function normalizeReportText(value) {

  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .toLowerCase();

}



/*
  Find the correct ITEM.
*/

function findReportItem(orderItem) {

  if (!orderItem) {
    return null;
  }


  const possibleIds = [
    orderItem.id,
    orderItem.itemId,
    orderItem.itemID,
    orderItem.productId,
    orderItem.productID
  ];


  for (const id of possibleIds) {

    if (!id) {
      continue;
    }

    const found =
      ITEMS.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (found) {
      return found;
    }

  }


  const possibleNames = [
    orderItem.arabic,
    orderItem.name,
    orderItem.item,
    orderItem.product
  ];


  for (const value of possibleNames) {

    if (!value) {
      continue;
    }


    const normalized =
      normalizeReportText(value);


    const found =
      ITEMS.find(
        item => {

          const names = [
            item.id,
            item.name,
            item.arabic,
            ...(item.aliases || [])
          ];


          return names.some(
            name =>
              normalizeReportText(name) ===
              normalized
          );

        }
      );


    if (found) {
      return found;
    }

  }


  return null;

}



/* =================================
   REPORT QUANTITY HELPERS
================================= */

/*
  Page 1:
  - Sandwiches = pieces
  - Cookies = boxes
*/

function arabicQuantity(count, singular, plural) {
  const n = Number(count) || 0;

  if (n === 1) {
    return `1\u00A0${singular}`;
  }

  return `${n}\u00A0${plural}`;
}


function formatReportPage1Quantity(item, quantity) {

  const qty = Number(quantity) || 0;

  if (item.group === "cookies") {

    const boxes = Math.floor(qty / item.pack);
    const pieces = qty % item.pack;

    if (boxes && pieces) {
      return `${arabicQuantity(boxes, "علبة", "علب")}\u00A0+\u00A0${arabicQuantity(pieces, "قطعة", "قطع")}`;
    }

    if (boxes) {
      return arabicQuantity(boxes, "علبة", "علب");
    }

    if (pieces) {
      return arabicQuantity(pieces, "قطعة", "قطع");
    }

    return "—";
  }

  if (!qty) {
    return "—";
  }

  return arabicQuantity(qty, "قطعة", "قطع");
}


function formatReportPage2Quantity(item, quantity) {

  const qty = Number(quantity) || 0;

  if (qty <= 0) {
    return "—";
  }

  const boxes = Math.floor(qty / item.pack);
  const pieces = qty % item.pack;

  if (boxes && pieces) {
    return `${arabicQuantity(boxes, "علبة", "علب")}\u00A0+\u00A0${arabicQuantity(pieces, "قطعة", "قطع")}`;
  }

  if (boxes) {
    return arabicQuantity(boxes, "علبة", "علب");
  }

  return arabicQuantity(pieces, "قطعة", "قطع");
}



/*
  Page 2:
  - Sandwiches = boxes + remainder pieces
  - Cookies = boxes
  - Never show decimal boxes.
*/

function formatReportPage2Quantity(
  item,
  quantity
) {

  const qty =
    Number(quantity) || 0;


  if (qty <= 0) {
    return "—";
  }


  const boxes =
    Math.floor(
      qty / item.pack
    );


  const pieces =
    qty % item.pack;


  /*
    Cookies:
    They are represented as boxes.
    Normally stored quantities are exact
    multiples of the pack.
  */

  if (item.group === "cookies") {

    if (boxes) {

      if (pieces) {

        return (
          `${boxes} علب + ${pieces} قطع`
        );

      }

      return `${boxes} علب`;

    }


    return `${pieces} قطع`;

  }


  /*
    Sandwiches:
    Keep both boxes and remaining pieces.
  */

  if (boxes && pieces) {

    return (
      `${boxes} علب + ${pieces} قطع`
    );

  }


  if (boxes) {

    return `${boxes} علب`;

  }


  return `${pieces} قطع`;

}



/*
  Unit label shown in the table header.
*/

function getReportUnit(
  item,
  pageMode
) {

  if (item.group === "cookies") {
    return "علب";
  }


  return pageMode === "pieces"
    ? "قطع"
    : "علب + قطع";

}



/*
  Convert product color to a light RGBA
  background.

  This avoids relying on CSS color-mix,
  which is not handled consistently by
  all PDF/print engines.
*/

function colorToRgba(
  color,
  alpha = 0.16
) {

  const fallback =
    `rgba(220,220,220,${alpha})`;


  if (!color) {
    return fallback;
  }


  const value =
    String(color)
      .trim();


  /*
    HEX
  */

  if (
    /^#[0-9a-fA-F]{6}$/.test(value)
  ) {

    const r =
      parseInt(
        value.substring(1, 3),
        16
      );

    const g =
      parseInt(
        value.substring(3, 5),
        16
      );

    const b =
      parseInt(
        value.substring(5, 7),
        16
      );


    return (
      `rgba(${r}, ${g}, ${b}, ${alpha})`
    );

  }


  /*
    Short HEX
  */

  if (
    /^#[0-9a-fA-F]{3}$/.test(value)
  ) {

    const r =
      parseInt(
        value[1] + value[1],
        16
      );

    const g =
      parseInt(
        value[2] + value[2],
        16
      );

    const b =
      parseInt(
        value[3] + value[3],
        16
      );


    return (
      `rgba(${r}, ${g}, ${b}, ${alpha})`
    );

  }


  /*
    RGB / RGBA
  */

  const rgbMatch =
    value.match(
      /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/i
    );


  if (rgbMatch) {

    return (
      `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`
    );

  }


  return fallback;

}



/* =================================
   REPORT TOTALS
================================= */

function buildReportTotals(
  customers
) {

  const reportItems =
    getReportItems();


  const totals = {};


  reportItems.forEach(
    item => {

      totals[item.id] = 0;

    }
  );


  const customerRows = [];


  (customers || []).forEach(
    customer => {

      const customerTotals = {};


      reportItems.forEach(
        item => {

          customerTotals[item.id] = 0;

        }
      );


      (customer.orders || []).forEach(
        order => {

          (order.items || []).forEach(
            orderItem => {

              const reportItem =
                findReportItem(
                  orderItem
                );


              if (!reportItem) {
                return;
              }


              const qty =
                Number(
                  orderItem.qty
                );


              if (
                !Number.isFinite(qty) ||
                qty <= 0
              ) {
                return;
              }


              customerTotals[
                reportItem.id
              ] += qty;


              totals[
                reportItem.id
              ] += qty;

            }
          );

        }
      );


      const hasItems =
        reportItems.some(
          item =>
            customerTotals[item.id] > 0
        );


      if (hasItems) {

        customerRows.push({

          customer,

          totals:
            customerTotals

        });

      }

    }
  );


  return {

    items:
      reportItems,

    customerRows,

    grandTotals:
      totals

  };

}



/* =================================
   REPORT PAGE
================================= */

function createReportPage(
  report,
  pageMode,
  pageNumber,
  totalPages,
  today
) {

  const isPiecesPage =
    pageMode === "pieces";


  const pageTitle =
    isPiecesPage
      ? "السندويتشات بالقطع — الكوكيز بالعلب"
      : "جميع الأصناف بالعلب والقطع";


  const pageSubtitle =
    isPiecesPage
      ? "الصفحة الأولى — السندويتشات بالقطع والكوكيز بالعلب"
      : "الصفحة الثانية — السندويتشات بالعلب مع القطع المتبقية والكوكيز بالعلب";


  return `

    <div
      class="report-page"
      data-page="${pageNumber}"
    >

      <div class="report-heading">

        <div>

          <div class="report-main-title">
            تقرير سحب البضاعة
          </div>

          <div class="report-subtitle">
            ${escapeHtml(today)}
          </div>

          <div class="report-page-title">
            ${escapeHtml(pageTitle)}
          </div>

        </div>


        <div class="report-meta">

          <span>
            الصفحة
          </span>

          <strong>
            ${pageNumber} / ${totalPages}
          </strong>

        </div>

      </div>


      <div class="report-page-note">
        ${escapeHtml(pageSubtitle)}
      </div>


      <div class="report-table-wrap">

        <table class="report-table">

          <thead>

            <tr>

              <th class="customer-col">
                الزبون
              </th>


              ${report.items.map(
                item => {

                  const bg =
                    colorToRgba(
                      item.color,
                      0.22
                    );


                  return `

                    <th
                      class="product-col"
                      style="
                        --item-color:${item.color};
                        background-color:${bg};
                      "
                    >

                      <span class="report-item-header">

                        <span
                          class="report-color-dot"
                          style="
                            background:${item.color};
                          "
                        ></span>

                        <span>
                          ${escapeHtml(
                            item.arabic
                          )}

                          <small class="report-unit">
                            (${getReportUnit(
                              item,
                              pageMode
                            )})
                          </small>
                        </span>

                      </span>

                    </th>

                  `;

                }
              ).join("")}

            </tr>

          </thead>


          <tbody>

            ${
              report.customerRows.length
                ? report.customerRows.map(
                    row => {

                      const customerName =
                        row.customer.name ||
                        row.customer.customer ||
                        "—";


                      return `

                        <tr class="customer-report-row">

                          <td class="customer-cell">

                            ${escapeHtml(
                              customerName
                            )}

                          </td>


                          ${report.items.map(
                            item => {

                              const qty =
                                row.totals[
                                  item.id
                                ];


                              const text =
                                qty > 0
                                  ? (
                                      isPiecesPage
                                        ? formatReportPage1Quantity(
                                            item,
                                            qty
                                          )
                                        : formatReportPage2Quantity(
                                            item,
                                            qty
                                          )
                                    )
                                  : "—";


                              const bg =
                                colorToRgba(
                                  item.color,
                                  0.075
                                );


                              return `

                                <td
                                  class="quantity-cell"
                                  style="
                                    --item-color:${item.color};
                                    background-color:${bg};
                                  "
                                >

                                  ${text}

                                </td>

                              `;

                            }
                          ).join("")}

                        </tr>

                      `;

                    }
                  ).join("")
                : `
                    <tr>

                      <td
                        class="report-empty-row"
                        colspan="${report.items.length + 1}"
                      >
                        لا توجد سحوبات لعرضها.
                      </td>

                    </tr>
                  `
            }

          </tbody>


          <tfoot>

            <tr>

              <th class="total-label">
                المجموع
              </th>


              ${report.items.map(
                item => {

                  const qty =
                    report.grandTotals[
                      item.id
                    ];


                  const text =
                    qty > 0
                      ? (
                          isPiecesPage
                            ? formatReportPage1Quantity(
                                item,
                                qty
                              )
                            : formatReportPage2Quantity(
                                item,
                                qty
                              )
                        )
                      : "—";


                  const bg =
                    colorToRgba(
                      item.color,
                      0.25
                    );


                  return `

                    <th
                      class="total-cell"
                      style="
                        --item-color:${item.color};
                        background-color:${bg};
                      "
                    >

                      ${text}

                    </th>

                  `;

                }
              ).join("")}

            </tr>

          </tfoot>

        </table>

      </div>


      <div class="report-footer">

        <span>
          عدد الزبائن:
          <strong>
            ${report.customerRows.length}
          </strong>
        </span>


        <span>
          عدد الأصناف:
          <strong>
            ${report.items.length}
          </strong>
        </span>


        <span>
          الصفحة ${pageNumber} من ${totalPages}
        </span>

      </div>

    </div>

  `;

}



/* =================================
   REPORT HTML
================================= */

function createReportHtml(
  customers
) {

  const report =
    buildReportTotals(
      customers
    );


  const today =
    new Date().toLocaleDateString(
      "ar-LB",
      {
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    );


  /*
    Exactly two report pages.
  */

  return `

    <div class="report-document">

      ${createReportPage(
        report,
        "pieces",
        1,
        2,
        today
      )}


      ${createReportPage(
        report,
        "boxes",
        2,
        2,
        today
      )}

    </div>

  `;

}



/* =================================
   LOAD REPORT
================================= */

async function loadReport() {

  try {

    const result =
      await postToGoogle({

        action:
          "getReview",

        password:
          currentPassword

      });


    reviewCustomers =
      result.customers || [];


    $("reportContent").innerHTML =
      createReportHtml(
        reviewCustomers
      );


    const report =
      buildReportTotals(
        reviewCustomers
      );


    setMessage(
      $("reportMsg"),
      `تم إنشاء التقرير — ${report.customerRows.length} عميل`,
      "success"
    );


  } catch (error) {

    console.error(
      "REPORT ERROR:",
      error
    );


    $("reportContent").innerHTML =
      "";


    setMessage(
      $("reportMsg"),
      error.message ||
      "حدث خطأ أثناء تحميل التقرير.",
      "error"
    );

  }

}



/* =================================
   LOGIN
================================= */

async function login() {

  const password =
    $("password")
      .value
      .trim();


  if (!password) {

    setMessage(
      $("loginMsg"),
      "أدخل رمز المستخدم.",
      "error"
    );


    return;

  }


  $("loginBtn").disabled =
    true;


  $("loginBtn").textContent =
    "جاري التحقق...";


  setMessage(
    $("loginMsg"),
    "جاري الاتصال..."
  );


  try {

    const result =
      await postToGoogle({

        action:
          "checkPassword",

        password:
          password

      });


    console.log(
      "LOGIN RESULT:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "رمز المستخدم غير صحيح."
      );

    }


    currentUser =
      result.user;


    currentPassword =
      password;


    $("password").value =
      "";


    setMessage(
      $("loginMsg"),
      ""
    );


    showMenu();


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    setMessage(
      $("loginMsg"),
      error.message ||
      "حدث خطأ أثناء تسجيل الدخول.",
      "error"
    );

  } finally {

    $("loginBtn").disabled =
      false;


    $("loginBtn").textContent =
      "دخول";

  }

}



$("loginBtn")
  .addEventListener(
    "click",
    login
  );


$("password")
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        login();

      }

    }
  );



/* =================================
   MENU BUTTONS
================================= */

$("addNewBtn")
  .addEventListener(
    "click",
    showForm
  );


$("reviewBtn")
  .addEventListener(
    "click",
    showReview
  );


$("fastPasteBtn")
  .addEventListener(
    "click",
    showFastPaste
  );


$("reportBtn")
  .addEventListener(
    "click",
    showReport
  );



/* =================================
   NAVIGATION
================================= */

$("backFromFormBtn")
  .addEventListener(
    "click",
    showMenu
  );


$("backFromReviewBtn")
  .addEventListener(
    "click",
    showMenu
  );


$("backFromFastPasteBtn")
  .addEventListener(
    "click",
    showMenu
  );


$("backFromReportBtn")
  .addEventListener(
    "click",
    showMenu
  );



/* =================================
   REPORT PRINT
================================= */

$("printReportBtn")
  .addEventListener(
    "click",
    () => {

      window.print();

    }
  );



/* =================================
   REPORT PDF DOWNLOAD
================================= */

$("downloadReportBtn")
  .addEventListener(
    "click",
    async () => {

      const reportContent =
        $("reportContent");


      if (
        !reportContent ||
        !reportContent.innerHTML.trim()
      ) {

        alert(
          "لا يوجد تقرير لتحميله."
        );

        return;

      }


      if (
        typeof html2pdf ===
        "undefined"
      ) {

        alert(
          "لم يتم تحميل أداة إنشاء PDF. تأكد من الاتصال بالإنترنت ثم أعد المحاولة."
        );

        return;

      }


      const button =
        $("downloadReportBtn");


      const originalText =
        button.innerHTML;


      try {

        button.disabled =
          true;


        button.innerHTML =
          "⏳ جاري إنشاء PDF...";


        /*
          The report itself contains exactly
          two .report-page elements.

          Each page has an explicit CSS page
          break, and html2pdf is instructed
          to respect CSS breaks.
        */

        const options = {

          margin: 0,

          filename:
            `تقرير-سحب-البضاعة-${new Date().toISOString().slice(0, 10)}.pdf`,

          image: {
            type: "jpeg",
            quality: 0.98
          },

          html2canvas: {

            scale: 2,

            useCORS: true,

            logging: false,

            backgroundColor: "#ffffff"

          },

          jsPDF: {

            unit: "mm",

            format: "a4",

            orientation: "landscape",

            compress: true

          },

          pagebreak: {

            mode: [
              "css",
              "legacy"
            ],

            before:
              ".report-page + .report-page"

          }

        };


        await html2pdf()
          .set(options)
          .from(reportContent)
          .save();


      } catch (error) {

        console.error(
          "PDF ERROR:",
          error
        );


        alert(
          "حدث خطأ أثناء إنشاء ملف PDF."
        );


      } finally {

        button.disabled =
          false;


        button.innerHTML =
          originalText;

      }

    }
  );



/* =================================
   LOGOUT
================================= */

function logout() {

  currentUser = "";

  currentPassword = "";

  reviewCustomers = [];

  fastParsedQuantities = null;


  resetStockForm();

  resetFastPasteForm();


  $("password").value =
    "";


  $("customerSearch").value =
    "";


  $("reviewList").innerHTML =
    "";


  $("reportContent").innerHTML =
    "";


  setMessage(
    $("reviewMsg"),
    ""
  );


  setMessage(
    $("reportMsg"),
    ""
  );


  setMessage(
    $("loginMsg"),
    ""
  );


  hideAllScreens();


  $("loginScreen")
    .classList
    .remove("hidden");


  setTimeout(
    () =>
      $("password").focus(),
    50
  );

}



$("menuLogoutBtn")
  .addEventListener(
    "click",
    logout
  );


$("logoutBtn")
  .addEventListener(
    "click",
    logout
  );


$("reviewLogoutBtn")
  .addEventListener(
    "click",
    logout
  );


$("fastPasteLogoutBtn")
  .addEventListener(
    "click",
    logout
  );


$("reportLogoutBtn")
  .addEventListener(
    "click",
    logout
  );



/* =================================
   ITEMS
================================= */

function createItem(item) {

  const wrapper =
    document.createElement("div");


  wrapper.className =
    "item";


  wrapper.dataset.id =
    item.id;


  wrapper.innerHTML = `

    <div class="item-head">

      <span
        class="shape"
        style="background:${item.color}"
      ></span>

      <span class="item-name">
        ${escapeHtml(item.arabic)}
      </span>

      <span class="item-pack">
        ${item.pack} / علبة
      </span>

    </div>


    <input
      class="qty"
      type="number"
      min="0"
      step="1"
      inputmode="numeric"
      placeholder="عدد القطع"
      data-id="${item.id}"
    >


    <div
      class="breakdown"
      data-breakdown="${item.id}"
    ></div>

  `;


  const input =
    wrapper.querySelector(
      ".qty"
    );


  input.addEventListener(
    "focus",
    () => {

      wrapper.classList
        .add("active");

    }
  );


  input.addEventListener(
    "input",
    () => {

      updateBreakdown(item);

      $("resultCard")
        .classList
        .add("hidden");

    }
  );


  return wrapper;

}



function renderItems() {

  $("sandwichItems")
    .innerHTML = "";


  $("cookieItems")
    .innerHTML = "";


  ITEMS
    .filter(
      item =>
        item.group === "sandwich"
    )
    .forEach(
      item =>
        $("sandwichItems")
          .appendChild(
            createItem(item)
          )
    );


  ITEMS
    .filter(
      item =>
        item.group === "cookies"
    )
    .forEach(
      item =>
        $("cookieItems")
          .appendChild(
            createItem(item)
          )
    );

}



function getQty(item) {

  const input =
    document.querySelector(
      `.qty[data-id="${item.id}"]`
    );


  if (!input) {

    return 0;

  }


  const value =
    Number.parseInt(
      input.value,
      10
    );


  return (
    Number.isFinite(value) &&
    value > 0
  )
    ? value
    : 0;

}



function formatBreakdown(
  qty,
  pack
) {

  if (!qty) {

    return "";

  }


  const boxes =
    Math.floor(
      qty / pack
    );


  const pieces =
    qty % pack;


  if (
    boxes &&
    pieces
  ) {

    return (
      `${boxes} علبة + ` +
      `${pieces} قطعة`
    );

  }


  if (boxes) {

    return (
      `${boxes} علبة`
    );

  }


  return (
    `${pieces} قطعة`
  );

}



function updateBreakdown(item) {

  const qty =
    getQty(item);


  const text =
    formatBreakdown(
      qty,
      item.pack
    );


  const target =
    document.querySelector(
      `[data-breakdown="${item.id}"]`
    );


  target.innerHTML =
    qty
      ? `<strong>${qty} قطعة</strong> = ${text}`
      : "";

}



function getData() {

  const quantities = {};


  ITEMS.forEach(
    item => {

      quantities[item.id] =
        getQty(item);

    }
  );


  return quantities;

}



/* =================================
   SUMMARY
================================= */

function showSummary() {

  const customer =
    $("customer")
      .value
      .trim();


  if (!customer) {

    setMessage(
      $("formMsg"),
      "اكتب اسم الزبون أولاً.",
      "error"
    );


    $("customer").focus();


    return false;

  }


  const quantities =
    getData();


  const selected =
    ITEMS.filter(
      item =>
        quantities[item.id] > 0
    );


  if (!selected.length) {

    setMessage(
      $("formMsg"),
      "أدخل كمية صنف واحد على الأقل.",
      "error"
    );


    return false;

  }


  $("result").innerHTML =
    selected
      .map(
        item => {

          const qty =
            quantities[item.id];


          return `

            <div class="result-row">

              <span class="result-name">
                ${escapeHtml(item.arabic)}
              </span>

              <span class="result-value">

                ${qty} قطعة =

                ${formatBreakdown(
                  qty,
                  item.pack
                )}

              </span>

            </div>

          `;

        }
      )
      .join("");


  $("resultCard")
    .classList
    .remove("hidden");


  setMessage(
    $("formMsg"),
    "تم عرض التقسيم. إذا كان كل شيء صحيحاً اضغط حفظ.",
    "success"
  );


  $("resultCard")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  return true;

}



$("displayBtn")
  .addEventListener(
    "click",
    showSummary
  );



/* =================================
   SAVE NORMAL FORM
================================= */

$("stockForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!showSummary()) {

        return;

      }


      const customer =
        $("customer")
          .value
          .trim();


      const quantities =
        getData();


      $("submitBtn").disabled =
        true;


      $("displayBtn").disabled =
        true;


      $("submitBtn").textContent =
        "جاري الحفظ...";


      try {

        const result =
          await postToGoogle({

            action:
              "submitStock",

            password:
              currentPassword,

            customer:
              customer,

            quantities:
              quantities

          });


        console.log(
          "SAVE RESULT:",
          result
        );


        setMessage(
          $("formMsg"),
          "تم الحفظ بنجاح في Google Sheets ✅",
          "success"
        );


        resetStockForm();


        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });


      } catch (error) {

        console.error(
          "SAVE ERROR:",
          error
        );


        setMessage(
          $("formMsg"),
          error.message ||
          "تعذر الحفظ.",
          "error"
        );

      } finally {

        $("submitBtn").disabled =
          false;


        $("displayBtn").disabled =
          false;


        $("submitBtn").textContent =
          "✅ حفظ في Google Sheets";

      }

    }
  );



function resetStockForm() {

  if ($("customer")) {

    $("customer").value = "";

  }


  document
    .querySelectorAll(".qty")
    .forEach(
      input => {
        input.value = "";
      }
    );


  document
    .querySelectorAll(".breakdown")
    .forEach(
      element => {
        element.innerHTML = "";
      }
    );


  if ($("resultCard")) {

    $("resultCard")
      .classList
      .add("hidden");

  }


  if ($("formMsg")) {

    setMessage(
      $("formMsg"),
      ""
    );

  }

}



/* =================================
   FAST PASTE
================================= */

function showFastPaste() {

  hideAllScreens();


  resetFastPasteForm();


  $("fastPasteUser")
    .textContent =
    currentUser;


  $("fastPasteScreen")
    .classList
    .remove("hidden");


  setTimeout(
    () =>
      $("fastCustomer").focus(),
    50
  );

}



function normalizeFastText(value) {

  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .toLowerCase();

}



function normalizeArabicNumbers(text) {

  return String(text)

    .replace(
      /[٠-٩]/g,
      digit =>
        String(
          "٠١٢٣٤٥٦٧٨٩"
            .indexOf(digit)
        )
    )

    .replace(
      /[۰-۹]/g,
      digit =>
        String(
          "۰۱۲۳۴۵۶۷۸۹"
            .indexOf(digit)
        )
    );

}



function findFastItem(nameText) {

  const normalized =
    normalizeFastText(
      nameText
    );


  const candidates = [];


  ITEMS.forEach(
    item => {

      item.aliases.forEach(
        alias => {

          candidates.push({

            item: item,

            alias:
              normalizeFastText(
                alias
              )

          });

        }
      );

    }
  );


  candidates.sort(
    (a, b) =>
      b.alias.length -
      a.alias.length
  );


  const exact =
    candidates.find(
      candidate =>
        candidate.alias ===
        normalized
    );


  if (exact) {

    return exact.item;

  }


  const partial =
    candidates.find(
      candidate =>
        normalized.includes(
          candidate.alias
        )
    );


  return partial
    ? partial.item
    : null;

}



function parseFastOrder(text) {

  const quantities = {};


  ITEMS.forEach(
    item => {

      quantities[item.id] =
        0;

    }
  );


  const errors = [];


  const normalizedText =
    normalizeArabicNumbers(
      text
    );


  const lines =
    String(normalizedText || "")
      .split(/\r?\n/)
      .map(
        line =>
          line.trim()
      )
      .filter(
        line =>
          line.length > 0
      );


  if (!lines.length) {

    return {

      success: false,

      quantities: quantities,

      errors: [
        "الصق الطلب أولاً."
      ]

    };

  }


  lines.forEach(
    (line, index) => {

      const match =
        line.match(
          /^\s*(\d+(?:[.,]\d+)?)\s*(?:x|×|-|:)?\s*(.+?)\s*$/
        );


      if (!match) {

        errors.push(
          `السطر ${index + 1}: لم أستطع قراءة "${line}".`
        );

        return;

      }


      const rawNumber =
        match[1]
          .replace(",", ".");


      const number =
        Number(rawNumber);


      if (
        !Number.isFinite(number) ||
        number <= 0 ||
        !Number.isInteger(number)
      ) {

        errors.push(
          `السطر ${index + 1}: الكمية يجب أن تكون رقمًا صحيحًا موجبًا.`
        );

        return;

      }


      const itemText =
        match[2]
          .trim();


      const item =
        findFastItem(
          itemText
        );


      if (!item) {

        errors.push(
          `السطر ${index + 1}: الصنف "${itemText}" غير معروف.`
        );

        return;

      }


      let pieces =
        number;


      if (
        item.group === "cookies"
      ) {

        pieces =
          number *
          item.pack;

      }


      quantities[item.id] +=
        pieces;

    }
  );


  const hasQuantity =
    Object.values(
      quantities
    ).some(
      value =>
        value > 0
    );


  if (!hasQuantity) {

    errors.push(
      "لم يتم العثور على أي كمية صالحة."
    );

  }


  return {

    success:
      errors.length === 0,

    quantities:
      quantities,

    errors:
      errors

  };

}



/* =================================
   FAST PREVIEW
================================= */

function showFastPreview(
  quantities
) {

  const selected =
    ITEMS.filter(
      item =>
        quantities[item.id] > 0
    );


  if (!selected.length) {

    $("fastPreviewCard")
      .classList
      .add("hidden");

    return;

  }


  $("fastPreview").innerHTML =
    selected
      .map(
        item => {

          const pieces =
            quantities[item.id];


          const boxes =
            Math.floor(
              pieces / item.pack
            );


          if (
            item.group === "cookies"
          ) {

            return `

              <div class="fast-preview-row">

                <div class="fast-preview-name">

                  <span
                    class="shape"
                    style="background:${item.color}"
                  ></span>

                  <div>

                    <strong>
                      ${escapeHtml(
                        item.arabic
                      )}
                    </strong>

                    <small>
                      Cookies
                    </small>

                  </div>

                </div>


                <div class="fast-preview-value">

                  <strong>
                    ${boxes} علبة
                  </strong>

                  <span>
                    = ${pieces} قطعة
                  </span>

                </div>

              </div>

            `;

          }


          return `

            <div class="fast-preview-row">

              <div class="fast-preview-name">

                <span
                  class="shape"
                  style="background:${item.color}"
                ></span>

                <div>

                  <strong>
                    ${escapeHtml(
                      item.arabic
                    )}
                  </strong>

                  <small>
                    Sandwich
                  </small>

                </div>

              </div>


              <div class="fast-preview-value">

                <strong>
                  ${pieces} قطعة
                </strong>

                <span>
                  =
                  ${formatBreakdown(
                    pieces,
                    item.pack
                  )}
                </span>

              </div>

            </div>

          `;

        }
      )
      .join("");


  $("fastPreviewCard")
    .classList
    .remove("hidden");

}



function parseAndPreviewFastOrder() {

  const customer =
    $("fastCustomer")
      .value
      .trim();


  if (!customer) {

    setMessage(
      $("fastMsg"),
      "اكتب اسم الزبون أولاً.",
      "error"
    );


    $("fastCustomer").focus();

    return false;

  }


  const text =
    $("fastOrderText")
      .value
      .trim();


  const parsed =
    parseFastOrder(
      text
    );


  if (!parsed.success) {

    $("fastPreviewCard")
      .classList
      .add("hidden");


    setMessage(
      $("fastMsg"),
      parsed.errors.join(" "),
      "error"
    );


    return false;

  }


  fastParsedQuantities =
    parsed.quantities;


  showFastPreview(
    parsed.quantities
  );


  setMessage(
    $("fastMsg"),
    "تم التعرف على الطلب بنجاح. راجع المعاينة ثم اضغط حفظ.",
    "success"
  );


  $("fastPreviewCard")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });


  return true;

}



$("parseFastBtn")
  .addEventListener(
    "click",
    parseAndPreviewFastOrder
  );


$("fastOrderText")
  .addEventListener(
    "input",
    () => {

      fastParsedQuantities =
        null;


      $("fastPreviewCard")
        .classList
        .add("hidden");


      setMessage(
        $("fastMsg"),
        ""
      );

    }
  );


$("fastPasteForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        !parseAndPreviewFastOrder()
      ) {

        return;

      }


      const customer =
        $("fastCustomer")
          .value
          .trim();


      const quantities =
        fastParsedQuantities;


      $("saveFastBtn").disabled =
        true;


      $("parseFastBtn").disabled =
        true;


      $("saveFastBtn").textContent =
        "جاري الحفظ...";


      try {

        const result =
          await postToGoogle({

            action:
              "submitPastedStock",

            password:
              currentPassword,

            customer:
              customer,

            quantities:
              quantities

          });


        console.log(
          "FAST SAVE RESULT:",
          result
        );


        setMessage(
          $("fastMsg"),
          "تم حفظ السحب السريع بنجاح في Google Sheets ⚡✅",
          "success"
        );


        resetFastPasteForm();


        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });


      } catch (error) {

        console.error(
          "FAST SAVE ERROR:",
          error
        );


        setMessage(
          $("fastMsg"),
          error.message ||
          "تعذر حفظ السحب السريع.",
          "error"
        );

      } finally {

        $("saveFastBtn").disabled =
          false;


        $("parseFastBtn").disabled =
          false;


        $("saveFastBtn").textContent =
          "⚡ حفظ السحب";

      }

    }
  );



function resetFastPasteForm() {

  fastParsedQuantities = null;


  if ($("fastCustomer")) {

    $("fastCustomer").value =
      "";

  }


  if ($("fastOrderText")) {

    $("fastOrderText").value =
      "";

  }


  if ($("fastPreview")) {

    $("fastPreview").innerHTML =
      "";

  }


  if ($("fastPreviewCard")) {

    $("fastPreviewCard")
      .classList
      .add("hidden");

  }


  if ($("fastMsg")) {

    setMessage(
      $("fastMsg"),
      ""
    );

  }

}



/* =================================
   REVIEW
================================= */

async function showReview() {

  hideAllScreens();


  $("reviewUser")
    .textContent =
    currentUser;


  $("reviewScreen")
    .classList
    .remove("hidden");


  $("customerSearch")
    .value = "";


  loadReview();

}



async function loadReview() {

  $("reviewList").innerHTML =
    "";


  setMessage(
    $("reviewMsg"),
    "جاري تحميل السحوبات..."
  );


  try {

    const result =
      await postToGoogle({

        action:
          "getReview",

        password:
          currentPassword

      });


    console.log(
      "REVIEW RESULT:",
      result
    );


    reviewCustomers =
      result.customers || [];


    if (
      reviewCustomers.length
    ) {

      setMessage(
        $("reviewMsg"),
        `تم تحميل ${reviewCustomers.length} زبون.`,
        "success"
      );

    } else {

      setMessage(
        $("reviewMsg"),
        "لا توجد سحوبات محفوظة لهذا المستخدم."
      );

    }


    renderReviewCustomers();


  } catch (error) {

    console.error(
      "REVIEW ERROR:",
      error
    );


    reviewCustomers = [];


    setMessage(
      $("reviewMsg"),
      error.message ||
      "تعذر تحميل السحوبات.",
      "error"
    );


    $("reviewList").innerHTML =
      "";

  }

}



/* =================================
   SEARCH
================================= */

function normalizeSearch(value) {

  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

}


$("customerSearch")
  .addEventListener(
    "input",
    renderReviewCustomers
  );



/* =================================
   RENDER CUSTOMERS
================================= */

function renderReviewCustomers() {

  const query =
    normalizeSearch(
      $("customerSearch").value
    );


  const filtered =
    reviewCustomers.filter(
      customer => {

        return normalizeSearch(
          customer.name
        ).includes(query);

      }
    );


  if (!filtered.length) {

    $("reviewList").innerHTML = `

      <div class="empty-review">
        لا يوجد زبون مطابق للبحث.
      </div>

    `;

    return;

  }


  $("reviewList").innerHTML =
    filtered
      .map(
        customer =>
          createCustomerReview(
            customer
          )
      )
      .join("");


  document
    .querySelectorAll(
      ".customer-header"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const orders =
              button
                .nextElementSibling;


            const toggle =
              button.querySelector(
                ".customer-toggle"
              );


            const hidden =
              orders.classList
                .contains("hidden");


            if (hidden) {

              orders.classList
                .remove("hidden");

              toggle.textContent =
                "−";

            } else {

              orders.classList
                .add("hidden");

              toggle.textContent =
                "+";

            }

          }
        );

      }
    );

}



function createCustomerReview(
  customer
) {

  const orders =
    customer.orders || [];


  return `

    <div class="customer-group">

      <button
        type="button"
        class="customer-header"
      >

        <div class="customer-title">

          <strong>
            ${escapeHtml(
              customer.name
            )}
          </strong>

          <span>

            ${orders.length}

            ${
              orders.length === 1
                ? "طلب"
                : "طلبات"
            }

          </span>

        </div>

        <span class="customer-toggle">
          +
        </span>

      </button>


      <div
        class="customer-orders hidden"
      >

        ${
          orders
            .map(
              (order, index) =>
                createOrderHtml(
                  order,
                  index
                )
            )
            .join("")
        }

      </div>

    </div>

  `;

}



function createOrderHtml(
  order,
  index
) {

  return `

    <div class="review-order">

      <div class="order-header">

        <div>

          <strong>
            السحب #${index + 1}
          </strong>

          <span>
            ${escapeHtml(
              order.date
            )}
          </span>

        </div>

        <span class="order-user">

          المستخدم:
          ${escapeHtml(
            order.user
          )}

        </span>

      </div>


      <div class="review-items">

        ${
          (order.items || [])
            .map(
              item => {

                const qty =
                  Number(
                    item.qty
                  );


                const pack =
                  Number(
                    item.pack
                  );


                return `

                  <div class="review-item">

                    <span>
                      ${escapeHtml(
                        item.arabic
                      )}
                    </span>

                    <strong>

                      ${qty}
                      قطعة

                      =

                      ${formatBreakdown(
                        qty,
                        pack
                      )}

                    </strong>

                  </div>

                `;

              }
            )
            .join("")
        }

      </div>

    </div>

  `;

}



/* =================================
   START APPLICATION
================================= */

renderItems();
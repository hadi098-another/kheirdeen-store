/*
  ضع رابط Google Apps Script Web App هنا بعد نشره.
*/
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4Vsy8KJKo1bW-8CjcSoqUcoR4IYLVJR3aL5GtwRq6zEpdP8IArbA47Q2UoGlusYCo/exec";

const ITEMS = [
  { id: "red",       name: "Red",        arabic: "أحمر",       group: "sandwich", pack: 18, color: "#e53935" },
  { id: "cheese",    name: "Cheese",     arabic: "جبنة",       group: "sandwich", pack: 24, color: "#f5c400" },
  { id: "chocolate", name: "Chocolate",  arabic: "شوكولا",     group: "sandwich", pack: 24, color: "#222222" },
  { id: "creama",    name: "Creama",     arabic: "كريما",      group: "sandwich", pack: 24, color: "#3f7ee8" },
  { id: "peacon",    name: "Peacon",     arabic: "بيكان",      group: "sandwich", pack: 24, color: "#f28c28" },
  { id: "zaatar",    name: "Zaatar",     arabic: "زعتر",      group: "sandwich", pack: 30, color: "#35a853" },
  { id: "strawberry",name: "Strawberry", arabic: "فراولة",     group: "sandwich", pack: 24, color: "#ec5aa0" },
  { id: "vanilla",   name: "Cookies Vanilla",  arabic: "كوكيز فانيلا",   group: "cookies", pack: 20, color: "#e8d7b5" },
  { id: "cookieChocolate", name: "Cookies Chocolate", arabic: "كوكيز شوكولا", group: "cookies", pack: 20, color: "#5a3825" }
];

let currentUser = "";
let currentPassword = "";

const $ = (id) => document.getElementById(id);

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = "message" + (type ? " " + type : "");
}

function createItem(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "item";
  wrapper.dataset.id = item.id;

  wrapper.innerHTML = `
    <div class="item-head">
      <span class="shape" style="background:${item.color}"></span>
      <span class="item-name">${item.arabic}</span>
      <span class="item-pack">${item.pack} / علبة</span>
    </div>
    <input class="qty" type="number" min="0" step="1" inputmode="numeric"
           placeholder="عدد القطع" data-id="${item.id}">
    <div class="breakdown" data-breakdown="${item.id}"></div>
  `;

  const input = wrapper.querySelector(".qty");

  input.addEventListener("focus", () => wrapper.classList.add("active"));
  input.addEventListener("input", () => {
    updateBreakdown(item);
    $("resultCard").classList.add("hidden");
  });

  return wrapper;
}

function renderItems() {
  $("sandwichItems").innerHTML = "";
  $("cookieItems").innerHTML = "";

  ITEMS.filter(x => x.group === "sandwich")
    .forEach(item => $("sandwichItems").appendChild(createItem(item)));

  ITEMS.filter(x => x.group === "cookies")
    .forEach(item => $("cookieItems").appendChild(createItem(item)));
}

function getQty(item) {
  const input = document.querySelector(`.qty[data-id="${item.id}"]`);
  const value = Number.parseInt(input.value, 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatBreakdown(qty, pack) {
  if (!qty) return "";
  const boxes = Math.floor(qty / pack);
  const pieces = qty % pack;

  if (boxes && pieces) return `${boxes} علبة + ${pieces} قطعة`;
  if (boxes) return `${boxes} علبة`;
  return `${pieces} قطعة`;
}

function updateBreakdown(item) {
  const qty = getQty(item);
  const boxText = formatBreakdown(qty, item.pack);
  const target = document.querySelector(`[data-breakdown="${item.id}"]`);

  target.innerHTML = qty
    ? `<strong>${qty} قطعة</strong> = ${boxText}`
    : "";
}

function getData() {
  const quantities = {};

  ITEMS.forEach(item => {
    quantities[item.id] = getQty(item);
  });

  return quantities;
}

function showSummary() {
  const customer = $("customer").value.trim();

  if (!customer) {
    setMessage($("formMsg"), "اكتب اسم الزبون أولاً.", "error");
    $("customer").focus();
    return false;
  }

  const quantities = getData();
  const selected = ITEMS.filter(item => quantities[item.id] > 0);

  if (!selected.length) {
    setMessage($("formMsg"), "أدخل كمية صنف واحد على الأقل.", "error");
    return false;
  }

  $("result").innerHTML = selected.map(item => {
    const qty = quantities[item.id];
    return `
      <div class="result-row">
        <span class="result-name">${item.arabic}</span>
        <span class="result-value">${qty} قطعة = ${formatBreakdown(qty, item.pack)}</span>
      </div>
    `;
  }).join("");

  $("resultCard").classList.remove("hidden");
  setMessage($("formMsg"), "تم عرض التقسيم. إذا كان كل شيء صحيحاً اضغط حفظ.", "success");
  $("resultCard").scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

async function postToGoogle(data) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("ضع_رابط")) {
    throw new Error("لم يتم وضع رابط Google Apps Script داخل script.js");
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "حدث خطأ أثناء الحفظ.");
  }

  return result;
}

$("loginBtn").addEventListener("click", async () => {
  const password = $("password").value.trim();

  if (!password) {
    setMessage($("loginMsg"), "أدخل رمز المستخدم.", "error");
    return;
  }

  $("loginBtn").disabled = true;
  $("loginBtn").textContent = "جاري التحقق...";

  try {
    const result = await postToGoogle({
      action: "checkPassword",
      password
    });

    if (!result.success) {
      throw new Error("رمز المستخدم غير صحيح.");
    }

    currentUser = result.user;
    currentPassword = password;

    $("currentUser").textContent = currentUser;
    $("loginScreen").classList.add("hidden");
    $("formScreen").classList.remove("hidden");
    $("customer").focus();

  } catch (error) {
    setMessage($("loginMsg"), error.message || "تعذر التحقق.", "error");
  } finally {
    $("loginBtn").disabled = false;
    $("loginBtn").textContent = "دخول";
  }
});

$("password").addEventListener("keydown", (event) => {
  if (event.key === "Enter") $("loginBtn").click();
});

$("displayBtn").addEventListener("click", showSummary);

$("stockForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const customer = $("customer").value.trim();

  if (!showSummary()) return;

  const quantities = getData();

  $("submitBtn").disabled = true;
  $("displayBtn").disabled = true;
  $("submitBtn").textContent = "جاري الحفظ...";

  try {
    await postToGoogle({
      action: "submitStock",
      password: currentPassword,
      customer,
      quantities
    });

    setMessage($("formMsg"), "تم الحفظ بنجاح في Google Sheets ✅", "success");

    // تصفير النموذج بعد الحفظ
    $("customer").value = "";
    document.querySelectorAll(".qty").forEach(input => {
      input.value = "";
    });
    document.querySelectorAll(".breakdown").forEach(el => {
      el.innerHTML = "";
    });

    $("resultCard").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (error) {
    setMessage($("formMsg"), error.message || "تعذر الحفظ. حاول مرة أخرى.", "error");
  } finally {
    $("submitBtn").disabled = false;
    $("displayBtn").disabled = false;
    $("submitBtn").textContent = "✅ حفظ في Google Sheets";
  }
});

$("logoutBtn").addEventListener("click", () => {
  currentUser = "";
  currentPassword = "";
  $("password").value = "";
  $("customer").value = "";
  document.querySelectorAll(".qty").forEach(input => input.value = "");
  document.querySelectorAll(".breakdown").forEach(el => el.innerHTML = "");
  $("resultCard").classList.add("hidden");
  setMessage($("formMsg"), "");
  setMessage($("loginMsg"), "");
  $("formScreen").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
  $("password").focus();
});

renderItems();

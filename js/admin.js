/* ============================================================
   PhotoRetouch Pro — Logique du panneau d'administration
   Module ES — connecté à Firebase (Auth + Firestore + Storage)
   ============================================================ */

import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ADMIN_EMAIL, formatPrice, fetchDelayPricing, saveDelayPricing } from "./data.js";
import {
  listOrders,
  updateOrder,
  deleteOrder as deleteOrderFromDb,
  attachRetouchedPhoto
} from "./orders-service.js";

let allOrders = [];
let currentDelaysAdmin = [];
let selectedOrderId = null;
let pendingRetouchedPhoto = null;
let pendingRetouchedPhotoName = null;

/* ---------------- Garde d'authentification (Firebase Auth) ---------------- */
onAuthStateChanged(auth, (user) => {
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    window.location.href = "admin-login.html";
    return;
  }
  // Utilisateur admin authentifié : on démarre le panneau
  initAdminPanel();
});

function initAdminPanel() {
  initNavigation();
  initLogout();
  initMobileToggle();
  loadOrders();
  loadPricing();
  initModals();
  initGlobalSearch();
  initStatusFilter();
}

/* ---------------- Navigation entre sections ---------------- */
function initNavigation() {
  const navLinks = document.querySelectorAll(".admin-nav a, .nav-link-btn");
  const titles = {
    dashboard: "Tableau de bord",
    orders: "Commandes",
    pricing: "Délais & Tarifs",
    settings: "Paramètres"
  };
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      const target = link.dataset.section;
      document.querySelectorAll(".admin-nav a").forEach(a => a.classList.remove("active"));
      document.querySelectorAll(`.admin-nav a[data-section="${target}"]`).forEach(a => a.classList.add("active"));
      document.querySelectorAll(".admin-section").forEach(sec => sec.classList.add("hidden"));
      document.getElementById(`section-${target}`).classList.remove("hidden");
      document.getElementById("page-title").textContent = titles[target] || "Admin";
      document.getElementById("admin-sidebar").classList.remove("open");
    });
  });
}

function initLogout() {
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "admin-login.html";
  });
}

function initMobileToggle() {
  const toggle = document.getElementById("admin-mobile-toggle");
  const sidebar = document.getElementById("admin-sidebar");
  if (toggle) toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
}

/* ---------------- Chargement des commandes (Firestore) ---------------- */
async function loadOrders() {
  try {
    allOrders = await listOrders();
    renderDashboard();
    renderOrdersTable();
  } catch (e) {
    console.error("Erreur de chargement des commandes depuis Firestore", e);
  }
}

function renderDashboard() {
  document.getElementById("stat-total").textContent = allOrders.length;
  document.getElementById("stat-pending").textContent = allOrders.filter(o => o.status === "En attente").length;
  document.getElementById("stat-progress").textContent = allOrders.filter(o => o.status === "En cours").length;
  document.getElementById("stat-done").textContent = allOrders.filter(o => o.status === "Terminée").length;
  const revenue = allOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  document.getElementById("stat-revenue").textContent = formatPrice(revenue);

  const recent = allOrders.slice(0, 6);
  const tbody = document.getElementById("recent-orders-body");
  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">Aucune commande pour le moment.</td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map(o => `
    <tr>
      <td>${escapeHtml(o.client_name)}</td>
      <td>${escapeHtml(o.service_name)}</td>
      <td>${escapeHtml(o.delay_label)}</td>
      <td style="color:var(--color-gold); font-weight:600;">${formatPrice(o.price)}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join("");
}

function statusBadge(status) {
  const map = { "En attente": "pending", "En cours": "progress", "Terminée": "done" };
  return `<span class="status-badge ${map[status] || 'pending'}">${status || 'En attente'}</span>`;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " +
         d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

/* ---------------- Table complète des commandes ---------------- */
function initStatusFilter() {
  document.getElementById("status-filter").addEventListener("change", renderOrdersTable);
}
function initGlobalSearch() {
  document.getElementById("global-search").addEventListener("input", renderOrdersTable);
}

function renderOrdersTable() {
  const statusFilter = document.getElementById("status-filter").value;
  const search = document.getElementById("global-search").value.trim().toLowerCase();

  let list = allOrders;
  if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
  if (search) {
    list = list.filter(o =>
      (o.client_name || "").toLowerCase().includes(search) ||
      (o.email || "").toLowerCase().includes(search) ||
      (o.phone || "").toLowerCase().includes(search) ||
      (o.service_name || "").toLowerCase().includes(search)
    );
  }

  const tbody = document.getElementById("orders-table-body");
  const emptyState = document.getElementById("orders-empty");

  if (!list.length) {
    tbody.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  tbody.innerHTML = list.map(o => `
    <tr>
      <td class="thumb-cell">
        ${o.photo_url ? `<img src="${o.photo_url}" alt="Photo client" data-action="view-image" data-order="${o.id}" data-type="client">` : '—'}
      </td>
      <td>${escapeHtml(o.client_name)}</td>
      <td>
        <div style="font-size:0.82rem;">${escapeHtml(o.phone)}</div>
        <div style="font-size:0.78rem; color:var(--color-grey);">${escapeHtml(o.email)}</div>
      </td>
      <td>${escapeHtml(o.service_name)}</td>
      <td>${escapeHtml(o.delay_label)}</td>
      <td style="color:var(--color-gold); font-weight:600;">${formatPrice(o.price)}</td>
      <td>${statusBadge(o.status)}</td>
      <td style="font-size:0.78rem;">${formatDate(o.created_at)}</td>
      <td>
        <button class="icon-btn" title="Voir le détail" data-action="detail" data-order="${o.id}"><i class="fa-solid fa-eye"></i></button>
        ${o.photo_url ? `<button class="icon-btn" title="Télécharger la photo client" data-action="download" data-order="${o.id}" data-type="client"><i class="fa-solid fa-download"></i></button>` : ''}
        <button class="icon-btn danger" title="Supprimer" data-action="delete" data-order="${o.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join("");

  // Délégation d'événements sur les boutons/actions générés dynamiquement
  tbody.querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", () => {
      const orderId = el.dataset.order;
      const type = el.dataset.type;
      switch (el.dataset.action) {
        case "view-image": openImageModal(orderId, type); break;
        case "detail": openDetailModal(orderId); break;
        case "download": downloadPhoto(orderId, type); break;
        case "delete": handleDeleteOrder(orderId); break;
      }
    });
  });
}

/* ---------------- Téléchargement des photos (Firebase Storage) ---------------- */
async function downloadPhoto(orderId, type) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  const url = type === "client" ? order.photo_url : order.retouched_photo_url;
  if (!url) return;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${type}_${(order.client_name || "photo").replace(/\s+/g, "_")}_${orderId.slice(0,6)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    console.error("Erreur lors du téléchargement", e);
    // Solution de repli : ouvrir la photo dans un nouvel onglet
    window.open(url, "_blank");
  }
}

/* ---------------- Suppression d'une commande ---------------- */
async function handleDeleteOrder(orderId) {
  if (!confirm("Voulez-vous vraiment supprimer cette commande ? Cette action est irréversible.")) return;
  try {
    await deleteOrderFromDb(orderId);
    allOrders = allOrders.filter(o => o.id !== orderId);
    renderDashboard();
    renderOrdersTable();
  } catch (e) {
    console.error(e);
    alert("Erreur lors de la suppression.");
  }
}

/* ---------------- Modal image plein écran ---------------- */
function openImageModal(orderId, type) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  const src = type === "client" ? order.photo_url : order.retouched_photo_url;
  document.getElementById("image-modal-img").src = src;
  document.getElementById("image-modal").classList.add("show");
}

/* ---------------- Modal détail commande ---------------- */
function openDetailModal(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  selectedOrderId = orderId;
  pendingRetouchedPhoto = null;
  pendingRetouchedPhotoName = null;

  document.getElementById("order-detail-grid").innerHTML = `
    <div class="detail-item"><div class="k">Client</div><div class="v">${escapeHtml(order.client_name)}</div></div>
    <div class="detail-item"><div class="k">Téléphone</div><div class="v">${escapeHtml(order.phone)}</div></div>
    <div class="detail-item"><div class="k">Email</div><div class="v">${escapeHtml(order.email)}</div></div>
    <div class="detail-item"><div class="k">Service</div><div class="v">${escapeHtml(order.service_name)}</div></div>
    <div class="detail-item"><div class="k">Délai</div><div class="v">${escapeHtml(order.delay_label)}</div></div>
    <div class="detail-item"><div class="k">Prix</div><div class="v">${formatPrice(order.price)}</div></div>
    <div class="detail-item"><div class="k">Paiement</div><div class="v">${escapeHtml(order.payment_method || "Non renseigné")}</div></div>
    <div class="detail-item"><div class="k">Date</div><div class="v">${formatDate(order.created_at)}</div></div>
    ${order.notes ? `<div class="detail-item" style="grid-column:1/-1;"><div class="k">Notes du client</div><div class="v">${escapeHtml(order.notes)}</div></div>` : ""}
  `;

  document.getElementById("photo-preview-row").innerHTML = `
    <div class="photo-box">
      ${order.photo_url ? `<img src="${order.photo_url}" alt="Photo client" data-action="view-image" data-order="${order.id}" data-type="client">` : `<div style="width:150px;height:150px;display:flex;align-items:center;justify-content:center;background:var(--color-charcoal);border-radius:12px;color:var(--color-grey);">Aucune</div>`}
      <span>Photo originale</span>
    </div>
    <div class="photo-box">
      ${order.retouched_photo_url ? `<img src="${order.retouched_photo_url}" alt="Photo retouchée" data-action="view-image" data-order="${order.id}" data-type="retouched">` : `<div style="width:150px;height:150px;display:flex;align-items:center;justify-content:center;background:var(--color-charcoal);border-radius:12px;color:var(--color-grey);">En attente</div>`}
      <span>Photo retouchée</span>
    </div>
  `;
  document.getElementById("photo-preview-row").querySelectorAll("[data-action='view-image']").forEach(el => {
    el.addEventListener("click", () => openImageModal(el.dataset.order, el.dataset.type));
  });

  document.getElementById("detail-status-select").value = order.status || "En attente";
  document.getElementById("detail-alert-zone").innerHTML = "";

  // Réinitialise la zone d'upload de la photo retouchée
  const zone = document.getElementById("upload-retouched-zone");
  zone.innerHTML = `<i class="fa-solid fa-cloud-arrow-up gold-text"></i><p style="font-size:0.85rem; color:var(--color-grey-light); margin-top:8px;">Cliquez pour uploader la photo finalisée</p><input type="file" id="retouched-input" accept="image/*" style="display:none;">`;
  bindRetouchedUploadZone();

  document.getElementById("detail-modal").classList.add("show");
}

function bindRetouchedUploadZone() {
  const zone = document.getElementById("upload-retouched-zone");
  const input = document.getElementById("retouched-input");
  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", (e) => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingRetouchedPhoto = ev.target.result;
      pendingRetouchedPhotoName = file.name;
      zone.innerHTML = `<i class="fa-solid fa-circle-check gold-text"></i><p style="font-size:0.85rem; color:var(--color-grey-light); margin-top:8px;">Photo sélectionnée : ${escapeHtml(file.name)}</p>`;
    };
    reader.readAsDataURL(file);
  });
}

function initModals() {
  document.getElementById("detail-modal-close").addEventListener("click", () => {
    document.getElementById("detail-modal").classList.remove("show");
  });
  document.getElementById("image-modal-close").addEventListener("click", () => {
    document.getElementById("image-modal").classList.remove("show");
  });
  document.getElementById("image-modal").addEventListener("click", (e) => {
    if (e.target.id === "image-modal") document.getElementById("image-modal").classList.remove("show");
  });

  bindRetouchedUploadZone();

  document.getElementById("save-detail-btn").addEventListener("click", saveOrderDetail);
  document.getElementById("save-pricing-btn").addEventListener("click", savePricingSettings);
}

async function saveOrderDetail() {
  if (!selectedOrderId) return;
  const newStatus = document.getElementById("detail-status-select").value;

  const btn = document.getElementById("save-detail-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enregistrement...';

  try {
    await updateOrder(selectedOrderId, { status: newStatus });

    if (pendingRetouchedPhoto) {
      await attachRetouchedPhoto(selectedOrderId, pendingRetouchedPhoto, pendingRetouchedPhotoName);
    }

    // Recharge la liste pour refléter les changements (statut + éventuelle photo retouchée)
    allOrders = await listOrders();

    document.getElementById("detail-alert-zone").innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i><span>Commande mise à jour avec succès !</span></div>`;
    renderDashboard();
    renderOrdersTable();
    setTimeout(() => { document.getElementById("detail-modal").classList.remove("show"); }, 1200);
  } catch (e) {
    console.error(e);
    document.getElementById("detail-alert-zone").innerHTML = `<div class="alert alert-error"><i class="fa-solid fa-circle-exclamation"></i><span>Erreur lors de la mise à jour.</span></div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Enregistrer les modifications';
  }
}

/* ---------------- Gestion des délais / tarifs (Firestore) ---------------- */
async function loadPricing() {
  currentDelaysAdmin = await fetchDelayPricing();
  renderPricingGrid();
}

function renderPricingGrid() {
  const grid = document.getElementById("pricing-grid");
  grid.innerHTML = currentDelaysAdmin.map((d, i) => `
    <div class="pricing-edit-item">
      <label>${d.label}</label>
      <div class="price-input-group">
        <input type="number" class="form-control pricing-input" data-index="${i}" value="${d.price}" min="0" step="50">
        <span style="color:var(--color-grey); font-size:0.8rem;">FCFA</span>
      </div>
    </div>
  `).join("");
}

async function savePricingSettings() {
  const inputs = document.querySelectorAll(".pricing-input");
  inputs.forEach(input => {
    const idx = parseInt(input.dataset.index);
    currentDelaysAdmin[idx].price = parseInt(input.value) || 0;
  });

  const btn = document.getElementById("save-pricing-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enregistrement...';

  const success = await saveDelayPricing(currentDelaysAdmin);
  const zone = document.getElementById("pricing-alert-zone");
  zone.innerHTML = success
    ? `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i><span>Tarifs mis à jour avec succès ! Ils sont désormais actifs sur tout le site.</span></div>`
    : `<div class="alert alert-error"><i class="fa-solid fa-circle-exclamation"></i><span>Erreur lors de la sauvegarde des tarifs.</span></div>`;

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Enregistrer les tarifs';
}

(function () {
  "use strict";
  var D = window.PURIVA, S = D.settings;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return MAP[c]; }); };
  var catName = function (id) { var c = D.categories.find(function (x) { return x.id === id; }); return c ? c.name : ""; };
  var byId = function (id) { return D.products.find(function (p) { return p.id === id; }); };
  var visible = D.products.filter(function (p) { return p.visible !== false; });

  /* ---------- cart ---------- */
  var KEY = "puriva_cart_v1", cart = [], lastFocus = null;
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  cart = cart.filter(function (l) { return byId(l.id); });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} renderCart(); }
  function add(id, variant) {
    variant = variant || "";
    var k = id + "|" + variant, l = cart.find(function (x) { return x.k === k; });
    if (l) l.q++; else cart.push({ k: k, id: id, v: variant, q: 1 });
    save(); openCart();
  }
  function change(k, d) {
    var l = cart.find(function (x) { return x.k === k; }); if (!l) return;
    l.q += d; if (l.q < 1) cart = cart.filter(function (x) { return x.k !== k; });
    save();
  }
  function remove(k) { cart = cart.filter(function (x) { return x.k !== k; }); save(); }

  /* ---------- shared shell ---------- */
  function buildHeader() {
    var page = document.body.dataset.page;
    var links = [["home", "index.html", "Home"], ["products", "products.html", "Products"], ["about", "about.html", "About"]];
    $("#site-header").innerHTML =
      '<div class="nav-wrap"><nav class="nav" aria-label="Main">' +
      '<a class="nav-logo" href="index.html" aria-label="Puriva home"><img src="assets/Puriva-Logo-Display.png" alt="Puriva"></a>' +
      '<div class="nav-links">' + links.map(function (l) {
        return '<a href="' + l[1] + '"' + (l[0] === page ? ' aria-current="page"' : "") + ">" + l[2] + "</a>";
      }).join("") + "</div>" +
      '<div class="nav-actions"><button class="cart-btn" id="open-cart" aria-label="Open cart">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>' +
      '<span class="cart-count" id="cart-count" data-n="0">0</span></button>' +
      '<a class="btn btn-primary nav-order" href="products.html">Shop Now</a></div></nav></div>';
  }

  function buildFooter() {
    var soc = [];
    if (S.linkedin) soc.push('<li><a href="' + esc(S.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a></li>');
    if (S.facebook) soc.push('<li><a href="' + esc(S.facebook) + '" target="_blank" rel="noopener">Facebook</a></li>');
    if (S.instagram) soc.push('<li><a href="' + esc(S.instagram) + '" target="_blank" rel="noopener">Instagram</a></li>');
    $("#site-footer").innerHTML =
      '<footer><div class="wrap"><div class="foot">' +
      '<div><img src="assets/Puriva-Logo-Display.png" alt="Puriva"><p class="note">Puriva Group<br>Operating through Puriva Ultracare Products Limited</p></div>' +
      '<div><h4>Pages</h4><ul><li><a href="index.html">Home</a></li><li><a href="products.html">Products</a></li><li><a href="about.html">About</a></li></ul></div>' +
      '<div><h4>Contact</h4><ul><li><a href="https://wa.me/' + esc(S.whatsapp) + '" target="_blank" rel="noopener">WhatsApp ' + esc(S.whatsappDisplay) + '</a></li>' +
      '<li><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a></li><li>' + esc(S.address) + "</li></ul></div>" +
      '<div><h4>Follow</h4><ul>' + soc.join("") + "</ul></div></div>" +
      "<small>Puriva Group — Building Quality. Creating Value. Improving Everyday Living.</small></div></footer>";
  }

  function buildDrawer() {
    var d = document.createElement("div");
    d.innerHTML =
      '<div class="overlay" id="overlay"></div>' +
      '<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Your cart" aria-hidden="true">' +
      '<div class="drawer-head"><h3>Your cart</h3><button id="close-cart" aria-label="Close cart">✕</button></div>' +
      '<form id="order-form" novalidate style="display:flex;flex-direction:column;flex:1;min-height:0">' +
      '<div class="drawer-body"><div id="cart-items"></div>' +
      '<div class="seg" role="radiogroup" aria-label="Order type">' +
      '<label><input type="radio" name="ctype" value="Retail / Individual" checked>Retail / Individual</label>' +
      '<label><input type="radio" name="ctype" value="Wholesale">Wholesale</label></div>' +
      '<label class="field">Your name<input name="cname" autocomplete="name" required></label>' +
      '<label class="field">Your WhatsApp number<input name="cphone" type="tel" inputmode="tel" autocomplete="tel" placeholder="e.g. 0801 234 5678" required></label>' +
      '<label class="field">Note (optional)<textarea name="cnote" rows="2"></textarea></label>' +
      '<p class="err" id="form-err" role="alert"></p></div>' +
      '<div class="drawer-foot"><button class="btn btn-primary" type="submit" id="send-btn">Send order on WhatsApp</button>' +
      '<p class="note" id="form-note" style="margin-top:.8rem">Prices are on request. WhatsApp will open with your order ready. Press Send there to complete it.</p></div>' +
      "</form></aside>";
    while (d.firstChild) document.body.appendChild(d.firstChild);
  }

  /* ---------- drawer behaviour ---------- */
  function openCart() {
    lastFocus = document.activeElement;
    $("#drawer").classList.add("open"); $("#overlay").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false"); $("#close-cart").focus();
  }
  function closeCart() {
    $("#drawer").classList.remove("open"); $("#overlay").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderCart() {
    var n = cart.reduce(function (s, l) { return s + l.q; }, 0), c = $("#cart-count");
    c.textContent = n; c.dataset.n = n;
    var box = $("#cart-items");
    if (!cart.length) { box.innerHTML = '<p class="empty">Your cart is empty. Add a product to start your order.</p>'; return; }
    box.innerHTML = cart.map(function (l) {
      var p = byId(l.id);
      return '<div class="line"><img src="' + esc(p.image) + '" alt="">' +
        '<div><strong>' + esc(p.name) + "</strong>" + (l.v ? "<br><small>" + esc(l.v) + "</small>" : "") +
        '<br><span class="qty"><button type="button" data-dec="' + esc(l.k) + '" aria-label="Decrease quantity">−</button>' +
        "<span>" + l.q + '</span><button type="button" data-inc="' + esc(l.k) + '" aria-label="Increase quantity">+</button></span></div>' +
        '<button type="button" class="rm" data-rm="' + esc(l.k) + '">Remove</button></div>';
    }).join("");
  }

  /* ---------- WhatsApp ---------- */
  function buildMessage(type, name, phone, note) {
    var ref = "PV-" + Date.now().toString(36).toUpperCase().slice(-6);
    var lines = ["*New Puriva enquiry*", "Ref: " + ref, "Type: " + type, "Name: " + name, "WhatsApp: " + phone, "", "*Items*"];
    cart.forEach(function (l, i) {
      var p = byId(l.id);
      lines.push((i + 1) + ". " + p.name + (l.v ? " (" + l.v + ")" : "") + " × " + l.q);
    });
    if (note) lines.push("", "Note: " + note);
    lines.push("", "Please confirm availability and pricing.");
    return lines.join("\n");
  }

  function submitOrder(e) {
    e.preventDefault();
    var f = e.target.elements, err = $("#form-err"), name = f.cname.value.trim(), phone = f.cphone.value.trim();
    err.textContent = "";
    if (!cart.length) { err.textContent = "Your cart is empty."; return; }
    if (name.length < 2) { err.textContent = "Please enter your name."; f.cname.focus(); return; }
    if (phone.replace(/\D/g, "").length < 7) { err.textContent = "Please enter a valid WhatsApp number."; f.cphone.focus(); return; }
    var url = "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(buildMessage(f.ctype.value, name, phone, f.cnote.value.trim()));
    window.open(url, "_blank", "noopener");
    $("#form-note").innerHTML = "WhatsApp should have opened. Press <strong>Send</strong> there to complete your enquiry. It is not sent until you do. " +
      '<a href="' + url + '" target="_blank" rel="noopener" style="text-decoration:underline">Open WhatsApp again</a>';
  }

  /* ---------- reusable renderers ---------- */
  function card(p) {
    var v = (p.variants && p.variants.length)
      ? '<select aria-label="Size or variant" data-var="' + esc(p.id) + '">' + p.variants.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select>" : "";
    return '<article class="card"><a class="pic" href="products.html#' + esc(p.id) + '"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy"></a>' +
      '<div class="info"><span class="cat-label">' + esc(catName(p.category)) + "</span><h3>" + esc(p.name) + "</h3>" +
      '<p class="price">' + esc(p.short || "") + '</p><p class="price">Price on request</p>' + v +
      '<button class="btn btn-primary" data-add="' + esc(p.id) + '">Add to cart</button></div></article>';
  }

  function renderCats() {
    var el = $("#cats"); if (!el) return;
    el.innerHTML = D.categories.map(function (c, i) {
      var n = visible.filter(function (p) { return p.category === c.id; }).length;
      return '<a class="cat" href="products.html?cat=' + esc(c.id) + '"><span class="n">0' + (i + 1) + "</span><div><h3>" + esc(c.name) +
        "</h3><small>" + (n ? n + (n > 1 ? " products" : " product") : "Coming soon") + "</small></div></a>";
    }).join("");
  }

  function renderFeatured() {
    var el = $("#featured"); if (!el) return;
    var f = visible.filter(function (p) { return p.featured; });
    el.innerHTML = f.length ? f.map(card).join("") : '<p class="empty">New products are coming soon.</p>';
  }

  /* ---------- init ---------- */
  function init() {
    buildHeader(); buildFooter(); buildDrawer(); renderCats(); renderFeatured(); renderCart();
    document.addEventListener("click", function (e) {
      var t = e.target.closest("button,[data-add]"); if (!t) return;
      if (t.id === "open-cart") return openCart();
      if (t.id === "close-cart") return closeCart();
      if (t.dataset.add) { var s = $('select[data-var="' + t.dataset.add + '"]'); return add(t.dataset.add, s ? s.value : ""); }
      if (t.dataset.inc) return change(t.dataset.inc, 1);
      if (t.dataset.dec) return change(t.dataset.dec, -1);
      if (t.dataset.rm) return remove(t.dataset.rm);
    });
    $("#overlay").addEventListener("click", closeCart);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });
    $("#order-form").addEventListener("submit", submitOrder);
    if (location.hash === "#wholesale") {
      document.querySelector('input[name="ctype"][value="Wholesale"]').checked = true; openCart();
    }
  }

  window.PurivaApp = { add: add, openCart: openCart, esc: esc, catName: catName, card: card, visible: visible };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

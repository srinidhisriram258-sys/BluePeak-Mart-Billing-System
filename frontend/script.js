/**
 * BluePeak Mart - Real-World SaaS POS & Billing System Application Logic
 * Location: Avadi, Chennai, Tamil Nadu | Phone: 8237828998
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global Application State
  const state = {
    products: [],
    customers: [],
    bills: [],
    posCartItems: [],
    selectedPosCategory: 'All',
    selectedPayMethod: 'Cash',
    dashboardStats: null,
    activeView: 'pos', // POS BILLING SCREEN IS DEFAULT HOME VIEW
    ownerToken: localStorage.getItem('pos_owner_token') || null,
    pendingOwnerTargetView: null,
    charts: {},
    settings: {
      storeName: 'BluePeak Mart',
      storeTagline: 'Smart Retail • Faster Billing • Better Shopping',
      storeGst: '33AAACB9876C1ZB',
      storePhone: '8237828998',
      storeAddress: 'Avadi, Chennai, Tamil Nadu',
      defaultGstRate: 18
    }
  };

  // ==========================================================================
  // INITIALIZATION & EVENT LISTENERS
  // ==========================================================================
  initBackgroundCanvas();
  initLiveClock();
  initNavigation();
  initKeyboardShortcuts();
  initGlobalEvents();

  // Load initial catalog data
  loadInitialData();

  // ==========================================================================
  // 1. BACKGROUND CANVAS ANIMATION
  // ==========================================================================
  function initBackgroundCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.2
      });
    }

    function renderCanvas() {
      ctx.clearRect(0, 0, width, height);

      // Subtle blue grid lines
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 217, 255, ${p.alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(renderCanvas);
    }

    renderCanvas();
  }

  // ==========================================================================
  // 2. LIVE CLOCK
  // ==========================================================================
  function initLiveClock() {
    const clockText = document.getElementById('clockText');
    if (!clockText) return;

    function updateClock() {
      const now = new Date();
      clockText.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ==========================================================================
  // 3. NAVIGATION & OWNER AUTHENTICATION
  // ==========================================================================
  function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (btn.classList.contains('owner-protected') && !state.ownerToken) {
          state.pendingOwnerTargetView = view;
          openModal('ownerLoginModal');
          document.getElementById('ownerUsernameInput').focus();
        } else {
          switchView(view);
        }
      });
    });

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
    }

    updateOwnerSessionUI();
  }

  function updateOwnerSessionUI() {
    const roleDisplay = document.getElementById('userRoleDisplay');
    const nameDisplay = document.getElementById('userNameDisplay');
    const authBtnText = document.getElementById('ownerAuthBtnText');

    if (state.ownerToken) {
      if (roleDisplay) roleDisplay.textContent = 'Owner Mode';
      if (nameDisplay) nameDisplay.textContent = 'Store Owner';
      if (authBtnText) authBtnText.textContent = 'Logout';
      document.querySelectorAll('.lock-icon').forEach((icon) => (icon.style.display = 'none'));
    } else {
      if (roleDisplay) roleDisplay.textContent = 'Cashier Mode';
      if (nameDisplay) nameDisplay.textContent = 'Cashier Counter';
      if (authBtnText) authBtnText.textContent = 'Owner Login';
      document.querySelectorAll('.lock-icon').forEach((icon) => (icon.style.display = 'inline-block'));
    }
  }

  window.toggleOwnerAuth = function () {
    if (state.ownerToken) {
      localStorage.removeItem('pos_owner_token');
      state.ownerToken = null;
      updateOwnerSessionUI();
      showToast('Logged out of Owner mode', 'info');
      switchView('pos');
    } else {
      state.pendingOwnerTargetView = 'dashboard';
      openModal('ownerLoginModal');
    }
  };

  window.switchView = function (viewName) {
    state.activeView = viewName;

    document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.view-section').forEach((sec) => sec.classList.remove('active'));

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) targetSection.classList.add('active');

    if (viewName === 'pos') {
      renderPosProductsGrid();
      setTimeout(focusBarcodeScanner, 100);
    }
    if (viewName === 'dashboard') loadDashboardView();
    if (viewName === 'products') renderProductsView();
    if (viewName === 'customers') renderCustomersView();
    if (viewName === 'history') renderHistoryView();
    if (viewName === 'settings') testDatabaseConnection();
  };

  // ==========================================================================
  // 4. KEYBOARD SHORTCUTS
  // ==========================================================================
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // F2: Focus Barcode Scanner Input
      if (e.key === 'F2') {
        e.preventDefault();
        switchView('pos');
        focusBarcodeScanner();
      }
      // F4: Open Payment Modal
      else if (e.key === 'F4') {
        e.preventDefault();
        if (state.activeView === 'pos' && state.posCartItems.length > 0) {
          openPaymentModal();
        } else {
          showToast('Cart is empty. Add products before payment.', 'warning');
        }
      }
      // F8: Clear Cart
      else if (e.key === 'F8') {
        e.preventDefault();
        if (state.activeView === 'pos') {
          clearPosCart();
        }
      }
      // Esc: Close Modals
      else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach((modal) => {
          modal.classList.remove('active');
        });
      }
    });
  }

  window.focusBarcodeScanner = function () {
    const scanner = document.getElementById('posBarcodeScanner');
    if (scanner) {
      scanner.focus();
      scanner.select();
    }
  };

  // ==========================================================================
  // 5. DATA FETCHING & API CLIENT
  // ==========================================================================
  async function loadInitialData() {
    await checkDbHealth();
    await fetchProducts();
    await fetchCustomers();
    await fetchBills();
    renderPosProductsGrid();
    renderPosCustomerSelector();
  }

  async function checkDbHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const dbBadge = document.getElementById('dbStatusBadge');
      const dbText = document.getElementById('dbStatusText');

      if (data && data.database && data.database.connected) {
        if (dbBadge) dbBadge.querySelector('.status-indicator').className = 'status-indicator success';
        if (dbText) dbText.textContent = 'Online';
      } else {
        if (dbBadge) dbBadge.querySelector('.status-indicator').className = 'status-indicator danger';
        if (dbText) dbText.textContent = 'Disconnected';
      }
    } catch (err) {
      console.warn('Health check failed:', err);
    }
  }

  async function fetchProducts(search = '', category = '') {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
      const json = await res.json();
      if (json.success) {
        state.products = json.data;
        renderPosCategoryPills();
        const countDisplay = document.getElementById('statTotalProducts');
        if (countDisplay) countDisplay.textContent = state.products.length;
      }
    } catch (error) {
      showToast('Error loading product catalog', 'error');
    }
  }

  async function fetchCustomers(search = '') {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        state.customers = json.data;
        renderPosCustomerSelector();
      }
    } catch (error) {
      showToast('Error loading customer list', 'error');
    }
  }

  async function fetchBills(search = '', paymentMethod = '') {
    try {
      const headers = state.ownerToken ? { Authorization: `Bearer ${state.ownerToken}` } : {};
      const res = await fetch(`/api/bills?search=${encodeURIComponent(search)}&payment_method=${encodeURIComponent(paymentMethod)}`, { headers });
      const json = await res.json();
      if (json.success) {
        state.bills = json.data;
      }
    } catch (error) {
      showToast('Error loading invoice records', 'error');
    }
  }

  async function authFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(state.ownerToken ? { Authorization: `Bearer ${state.ownerToken}` } : {}),
      ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
  }

  // ==========================================================================
  // 6. POS CASHIER BILLING ENGINE
  // ==========================================================================
  function renderPosCategoryPills() {
    const pillsContainer = document.getElementById('posCategoryPills');
    if (!pillsContainer) return;

    const categories = ['All', ...new Set(state.products.map((p) => p.category))];

    pillsContainer.innerHTML = categories
      .map(
        (cat) => `
      <button class="cat-pill ${cat === state.selectedPosCategory ? 'active' : ''}" data-category="${cat}">
        ${cat} ${cat === 'All' ? `(${state.products.length})` : ''}
      </button>
    `
      )
      .join('');

    pillsContainer.querySelectorAll('.cat-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedPosCategory = btn.getAttribute('data-category');
        renderPosCategoryPills();
        renderPosProductsGrid();
      });
    });
  }

  function renderPosProductsGrid() {
    const container = document.getElementById('posProductsContainer');
    if (!container) return;

    const search = (document.getElementById('posProductSearch')?.value || '').toLowerCase();

    const filtered = state.products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.sku && p.sku.toLowerCase().includes(search)) ||
        (p.barcode && p.barcode.toLowerCase().includes(search));
      const matchesCategory = state.selectedPosCategory === 'All' || p.category === state.selectedPosCategory;
      return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state text-center py-5 col-span-full">
          <i class="fa-solid fa-box-open fa-3x text-muted mb-2"></i>
          <p class="text-muted">No products found matching filter.</p>
        </div>
      `;
    } else {
      container.innerHTML = filtered
        .map((p) => {
          const isOut = p.stock <= 0;
          const isLow = p.stock > 0 && p.stock <= 5;
          return `
          <div class="pos-product-card ${isOut ? 'opacity-50' : ''}" onclick="addPosProductToCart(${p.id})">
            <div class="pos-prod-header">
              <div>
                <h4 class="pos-prod-name">${escapeHtml(p.name)}</h4>
                <span class="pos-prod-sku">${escapeHtml(p.sku || `BPM-${p.id}`)}</span>
              </div>
              <span class="badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}">
                ${isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
              </span>
            </div>
            <div class="pos-prod-price">₹${parseFloat(p.price).toFixed(2)}</div>
            <div class="pos-prod-footer">
              <span class="text-muted text-sm">Stock: <strong>${p.stock}</strong></span>
              <button class="btn btn-sm btn-primary glow-btn" ${isOut ? 'disabled' : ''}>
                <i class="fa-solid fa-plus"></i> Add
              </button>
            </div>
          </div>
        `;
        })
        .join('');
    }
  }

  function renderPosCustomerSelector() {
    const select = document.getElementById('posCustomerSelect');
    if (!select) return;

    select.innerHTML =
      `<option value="">-- Walk-in / Select Customer --</option>` +
      state.customers
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.phone)})</option>`)
        .join('');
  }

  window.addPosProductToCart = function (productId) {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      return showToast(`"${product.name}" is Out of Stock!`, 'error');
    }

    const existingItem = state.posCartItems.find((item) => item.product_id === productId);

    if (existingItem) {
      if (product.stock < existingItem.quantity + 1) {
        return showToast(`Insufficient stock for "${product.name}". Only ${product.stock} available.`, 'error');
      }
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      state.posCartItems.push({
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        sku: product.sku || `BPM-${product.id}`,
        price: parseFloat(product.price),
        quantity: 1,
        total: parseFloat(product.price)
      });
    }

    renderPosCartTable();
    showToast(`Added ${product.name} to bill`, 'success');
  };

  function renderPosCartTable() {
    const tbody = document.getElementById('posCartBody');
    if (!tbody) return;

    if (state.posCartItems.length === 0) {
      tbody.innerHTML = `
        <tr class="empty-cart-row">
          <td colspan="5" class="text-center py-5 text-muted">
            <i class="fa-solid fa-basket-shopping fa-3x mb-3 text-dim"></i>
            <p>Cart is empty. Scan barcode or tap products on left to add.</p>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = state.posCartItems
        .map(
          (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.product_name)}</strong>
            <br><small class="text-mono text-cyan">${escapeHtml(item.sku)}</small>
          </td>
          <td>₹${item.price.toFixed(2)}</td>
          <td>
            <div class="qty-adjuster">
              <button class="btn btn-sm btn-ghost" onclick="adjustPosCartQty(${item.product_id}, -1)">-</button>
              <span class="px-2 font-weight-bold">${item.quantity}</span>
              <button class="btn btn-sm btn-ghost" onclick="adjustPosCartQty(${item.product_id}, 1)">+</button>
            </div>
          </td>
          <td class="text-cyan font-weight-bold">₹${item.total.toFixed(2)}</td>
          <td class="text-right">
            <button class="btn btn-sm btn-danger-ghost" onclick="removePosCartItem(${item.product_id})">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </td>
        </tr>
      `
        )
        .join('');
    }

    calculatePosTotals();
  }

  window.adjustPosCartQty = function (productId, delta) {
    const item = state.posCartItems.find((i) => i.product_id === productId);
    if (!item) return;

    const product = state.products.find((p) => p.id === productId);
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      removePosCartItem(productId);
      return;
    }

    if (product && product.stock < newQty) {
      return showToast(`Only ${product.stock} units available in stock.`, 'error');
    }

    item.quantity = newQty;
    item.total = newQty * item.price;
    renderPosCartTable();
  };

  window.removePosCartItem = function (productId) {
    state.posCartItems = state.posCartItems.filter((i) => i.product_id !== productId);
    renderPosCartTable();
  };

  window.clearPosCart = function () {
    if (state.posCartItems.length === 0) return;
    state.posCartItems = [];
    renderPosCartTable();
    showToast('Current bill cleared', 'info');
  };

  function calculatePosTotals() {
    const subtotal = state.posCartItems.reduce((acc, curr) => acc + curr.total, 0);

    const discountVal = parseFloat(document.getElementById('posDiscount')?.value) || 0;
    const gstPercent = parseFloat(document.getElementById('posGstPercent')?.value) || 0;

    const afterDiscount = Math.max(0, subtotal - discountVal);
    const gstAmount = (afterDiscount * gstPercent) / 100;
    const grandTotal = afterDiscount + gstAmount;

    if (document.getElementById('posSubtotal')) document.getElementById('posSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
    if (document.getElementById('posGstAmount')) document.getElementById('posGstAmount').textContent = `(₹${gstAmount.toFixed(2)})`;
    if (document.getElementById('posGrandTotal')) document.getElementById('posGrandTotal').textContent = `₹${grandTotal.toFixed(2)}`;

    return { subtotal, discountVal, gstAmount, grandTotal };
  }

  // Barcode / SKU Scan Execution
  async function handleBarcodeScan() {
    const input = document.getElementById('posBarcodeScanner');
    if (!input) return;
    const code = (input.value || '').trim();

    if (!code) {
      return showToast('Please scan or enter a barcode/SKU first', 'warning');
    }

    try {
      const res = await fetch(`/api/products/scan/${encodeURIComponent(code)}`);
      const json = await res.json();

      if (json.success && json.data) {
        addPosProductToCart(json.data.id);
        input.value = '';
      } else {
        showToast(json.message || `Product Not Found for code: "${code}"`, 'error');
      }
    } catch (error) {
      showToast('Error looking up barcode', 'error');
    }
  }

  // ==========================================================================
  // 7. POS PAYMENT & CASH CHANGE SYSTEM
  // ==========================================================================
  window.openPaymentModal = function () {
    if (state.posCartItems.length === 0) {
      return showToast('Please add products to current bill before checkout.', 'warning');
    }

    const { grandTotal } = calculatePosTotals();

    document.getElementById('payModalGrandTotal').textContent = `₹${grandTotal.toFixed(2)}`;
    document.getElementById('payAmountReceived').value = Math.ceil(grandTotal);

    selectPayMethod('Cash');
    updateCashChange();
    openModal('paymentModal');
  };

  window.selectPayMethod = function (method) {
    state.selectedPayMethod = method;

    document.querySelectorAll('.pay-tab').forEach((tab) => {
      if (tab.getAttribute('data-method') === method) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    document.querySelectorAll('.pay-method-content').forEach((content) => {
      content.classList.remove('active');
    });

    const target = document.getElementById(`payMethod${method}`);
    if (target) target.classList.add('active');
  };

  window.setCashPreset = function (val) {
    const { grandTotal } = calculatePosTotals();
    const input = document.getElementById('payAmountReceived');
    if (!input) return;

    if (val === 'exact') {
      input.value = Math.ceil(grandTotal);
    } else {
      input.value = parseFloat(val);
    }
    updateCashChange();
  };

  function updateCashChange() {
    const { grandTotal } = calculatePosTotals();
    const amountReceived = parseFloat(document.getElementById('payAmountReceived')?.value) || 0;
    const change = amountReceived - grandTotal;

    const changeDisplay = document.getElementById('payChangeAmount');
    const alertBadge = document.getElementById('cashAlertBadge');
    const confirmBtn = document.getElementById('btnConfirmCheckout');

    if (changeDisplay) changeDisplay.textContent = `₹${Math.max(0, change).toFixed(2)}`;

    if (amountReceived < grandTotal) {
      const shortBy = grandTotal - amountReceived;
      if (alertBadge) {
        alertBadge.className = 'badge-alert-danger';
        alertBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Insufficient Payment! Short by ₹${shortBy.toFixed(2)}`;
      }
      if (confirmBtn) confirmBtn.disabled = true;
    } else {
      if (alertBadge) {
        alertBadge.className = 'badge-alert-success';
        alertBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Payment Sufficient. Change to Return: ₹${change.toFixed(2)}`;
      }
      if (confirmBtn) confirmBtn.disabled = false;
    }
  }

  window.processPosCheckout = async function () {
    const { subtotal, discountVal, gstAmount, grandTotal } = calculatePosTotals();
    const customerId = document.getElementById('posCustomerSelect')?.value;

    let amountReceived = grandTotal;
    let changeReturned = 0;

    if (state.selectedPayMethod === 'Cash') {
      amountReceived = parseFloat(document.getElementById('payAmountReceived')?.value) || grandTotal;
      if (amountReceived < grandTotal) {
        return showToast('Cannot complete checkout: Insufficient payment received!', 'error');
      }
      changeReturned = amountReceived - grandTotal;
    }

    const payload = {
      customer_id: customerId || null,
      items: state.posCartItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      discount: discountVal,
      gst: gstAmount,
      payment_method: state.selectedPayMethod,
      amount_received: amountReceived,
      change_returned: changeReturned
    };

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast(`Payment Successful! Invoice ${json.data.invoice_number} generated.`, 'success');
        closeModal('paymentModal');

        // Clear Cart
        state.posCartItems = [];
        renderPosCartTable();

        // Refresh Inventory & Bills
        await fetchProducts();
        await fetchBills();
        renderPosProductsGrid();

        // Open Printable Invoice Receipt
        openInvoicePrintModal(json.data);
      } else {
        showToast(json.message || 'Error processing POS checkout', 'error');
      }
    } catch (error) {
      showToast('Server error while saving POS invoice', 'error');
    }
  };

  // ==========================================================================
  // 8. OWNER LOGIN HANDLER
  // ==========================================================================
  async function handleOwnerLoginFormSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('ownerUsernameInput').value;
    const password = document.getElementById('ownerPasswordInput').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = await res.json();

      if (json.success) {
        state.ownerToken = json.data.token;
        localStorage.setItem('pos_owner_token', json.data.token);
        updateOwnerSessionUI();
        closeModal('ownerLoginModal');
        showToast('Owner authentication successful', 'success');

        if (state.pendingOwnerTargetView) {
          switchView(state.pendingOwnerTargetView);
          state.pendingOwnerTargetView = null;
        }
      } else {
        showToast(json.message || 'Invalid credentials', 'error');
      }
    } catch (error) {
      showToast('Server error during owner login', 'error');
    }
  }

  // ==========================================================================
  // 9. ADMIN DASHBOARD & CHARTS
  // ==========================================================================
  async function loadDashboardView() {
    try {
      const res = await authFetch('/api/dashboard/stats');
      const json = await res.json();

      if (json.success) {
        state.dashboardStats = json.data;
        renderDashboardStats(json.data);
        renderDashboardCharts(json.data);
      } else {
        showToast(json.message || 'Failed to load dashboard stats', 'warning');
      }
    } catch (error) {
      showToast('Could not fetch dashboard statistics', 'warning');
    }
  }

  function renderDashboardStats(stats) {
    if (document.getElementById('statTotalSales'))
      document.getElementById('statTotalSales').textContent = `₹${stats.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (document.getElementById('statTotalBills')) document.getElementById('statTotalBills').textContent = stats.totalBills;
    if (document.getElementById('statTotalProducts')) document.getElementById('statTotalProducts').textContent = stats.totalProducts;
    if (document.getElementById('statTotalCustomers')) document.getElementById('statTotalCustomers').textContent = stats.totalCustomers;
    if (document.getElementById('statTodaySales'))
      document.getElementById('statTodaySales').textContent = `₹${stats.todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const lowStockBadge = document.getElementById('lowStockBadge');
    if (lowStockBadge) lowStockBadge.textContent = `${stats.lowStockProducts.length} items`;

    const lowStockTbody = document.querySelector('#lowStockTable tbody');
    if (lowStockTbody) {
      if (stats.lowStockProducts.length === 0) {
        lowStockTbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">All products have sufficient stock.</td></tr>`;
      } else {
        lowStockTbody.innerHTML = stats.lowStockProducts
          .map(
            (p) => `
          <tr>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td><span class="badge badge-info">${escapeHtml(p.category)}</span></td>
            <td>₹${parseFloat(p.price).toFixed(2)}</td>
            <td class="text-danger font-weight-bold">${p.stock} remaining</td>
            <td><span class="badge badge-danger">Low Stock</span></td>
          </tr>
        `
          )
          .join('');
      }
    }

    const recentBillsTbody = document.querySelector('#recentBillsTable tbody');
    if (recentBillsTbody) {
      if (stats.recentBills.length === 0) {
        recentBillsTbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No invoices generated yet.</td></tr>`;
      } else {
        recentBillsTbody.innerHTML = stats.recentBills
          .map(
            (b) => `
          <tr>
            <td><strong>${b.invoice_number}</strong></td>
            <td>${escapeHtml(b.customer_name || 'Walk-in Customer')}</td>
            <td class="text-cyan">₹${parseFloat(b.grand_total).toFixed(2)}</td>
            <td><span class="badge badge-info">${b.payment_method}</span></td>
            <td>${new Date(b.bill_date).toLocaleDateString()}</td>
          </tr>
        `
          )
          .join('');
      }
    }
  }

  function renderDashboardCharts(stats) {
    if (typeof Chart === 'undefined') return;

    const payCtx = document.getElementById('paymentChart');
    if (payCtx) {
      if (state.charts.payment) state.charts.payment.destroy();
      const labels = stats.paymentBreakdown.map((p) => p.method);
      const dataValues = stats.paymentBreakdown.map((p) => p.total);

      state.charts.payment = new Chart(payCtx, {
        type: 'doughnut',
        data: {
          labels: labels.length > 0 ? labels : ['No Data'],
          datasets: [
            {
              data: dataValues.length > 0 ? dataValues : [1],
              backgroundColor: ['#1677FF', '#00D9FF', '#7928ca', '#f59e0b'],
              borderColor: '#05070D',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } }
        }
      });
    }

    const prodCtx = document.getElementById('topProductsChart');
    if (prodCtx) {
      if (state.charts.products) state.charts.products.destroy();
      const names = stats.topProducts.map((p) => (p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name));
      const sales = stats.topProducts.map((p) => p.sold);

      state.charts.products = new Chart(prodCtx, {
        type: 'bar',
        data: {
          labels: names.length > 0 ? names : ['None'],
          datasets: [
            {
              label: 'Units Sold',
              data: sales.length > 0 ? sales : [0],
              backgroundColor: 'rgba(0, 217, 255, 0.6)',
              borderColor: '#00D9FF',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  // ==========================================================================
  // 10. ADMIN PRODUCTS & CUSTOMERS MANAGEMENT
  // ==========================================================================
  function renderProductsView() {
    const categories = ['All', ...new Set(state.products.map((p) => p.category))];
    const catSelect = document.getElementById('productCategoryFilter');
    if (catSelect) {
      catSelect.innerHTML = categories.map((c) => `<option value="${c}">${c}</option>`).join('');
    }
    filterAndRenderProducts();
  }

  function filterAndRenderProducts() {
    const search = (document.getElementById('productSearchInput')?.value || '').toLowerCase();
    const cat = document.getElementById('productCategoryFilter')?.value || 'All';

    const filtered = state.products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.sku && p.sku.toLowerCase().includes(search)) ||
        (p.barcode && p.barcode.toLowerCase().includes(search));
      const matchesCat = cat === 'All' || p.category === cat;
      return matchesSearch && matchesCat;
    });

    const grid = document.getElementById('productsGridContainer');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state text-center py-5"><i class="fa-solid fa-box-open fa-3x text-muted mb-3"></i><p>No products found matching your filter.</p></div>`;
    } else {
      grid.innerHTML = filtered
        .map((p) => {
          const isLowStock = p.stock <= 5;
          return `
          <div class="product-card">
            <div class="product-card-header">
              <div>
                <span class="product-cat">${escapeHtml(p.category)}</span>
                <h4 class="product-name">${escapeHtml(p.name)}</h4>
                <span class="text-mono text-cyan text-xs">${escapeHtml(p.sku || `BPM-${p.id}`)}</span>
              </div>
              <span class="badge ${isLowStock ? 'badge-danger' : 'badge-success'}">
                ${isLowStock ? 'Low Stock' : 'In Stock'}
              </span>
            </div>
            <div class="product-price">₹${parseFloat(p.price).toFixed(2)}</div>
            <div class="product-card-footer">
              <span class="text-muted text-sm">Qty: <strong>${p.stock}</strong></span>
              <div class="card-actions">
                <button class="btn btn-sm btn-ghost" onclick="openEditProductModal(${p.id})">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-danger-ghost" onclick="deleteProduct(${p.id})">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
        })
        .join('');
    }
  }

  window.openAddProductModal = function () {
    document.getElementById('productModalTitle').innerHTML = `<i class="fa-solid fa-box"></i> Add New Product`;
    document.getElementById('pmProductId').value = '';
    document.getElementById('productForm').reset();
    openModal('productModal');
  };

  window.openEditProductModal = function (id) {
    const prod = state.products.find((p) => p.id === id);
    if (!prod) return;

    document.getElementById('productModalTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Edit Product`;
    document.getElementById('pmProductId').value = prod.id;
    document.getElementById('pmName').value = prod.name;
    document.getElementById('pmCategory').value = prod.category;
    document.getElementById('pmSku').value = prod.sku || '';
    document.getElementById('pmBarcode').value = prod.barcode || '';
    document.getElementById('pmPrice').value = prod.price;
    document.getElementById('pmGstPercent').value = prod.gst_percent || 18;
    document.getElementById('pmStock').value = prod.stock;
    openModal('productModal');
  };

  async function handleProductFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('pmProductId').value;
    const name = document.getElementById('pmName').value;
    const category = document.getElementById('pmCategory').value;
    const sku = document.getElementById('pmSku').value;
    const barcode = document.getElementById('pmBarcode').value;
    const price = parseFloat(document.getElementById('pmPrice').value);
    const gst_percent = parseFloat(document.getElementById('pmGstPercent').value) || 18;
    const stock = parseInt(document.getElementById('pmStock').value, 10);

    const payload = { name, category, sku, barcode, price, gst_percent, stock };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message, 'success');
        closeModal('productModal');
        await fetchProducts();
        renderProductsView();
        renderPosProductsGrid();
      } else {
        showToast(json.message || 'Error saving product', 'error');
      }
    } catch (error) {
      showToast('Server error while saving product', 'error');
    }
  }

  window.deleteProduct = async function (id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        showToast(json.message, 'success');
        await fetchProducts();
        renderProductsView();
        renderPosProductsGrid();
      } else {
        showToast(json.message || 'Could not delete product', 'error');
      }
    } catch (error) {
      showToast('Error deleting product', 'error');
    }
  };

  function renderCustomersView() {
    filterAndRenderCustomers();
  }

  function filterAndRenderCustomers() {
    const search = (document.getElementById('customerSearchInput')?.value || '').toLowerCase();
    const filtered = state.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search) ||
        (c.email && c.email.toLowerCase().includes(search))
    );

    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No customer records found.</td></tr>`;
    } else {
      tbody.innerHTML = filtered
        .map(
          (c) => `
        <tr>
          <td>#CST-${c.id}</td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td>${escapeHtml(c.phone)}</td>
          <td>${escapeHtml(c.email || 'N/A')}</td>
          <td>${escapeHtml(c.address || 'N/A')}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
          <td class="text-right">
            <button class="btn btn-sm btn-ghost" onclick="openEditCustomerModal(${c.id})">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger-ghost" onclick="deleteCustomer(${c.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `
        )
        .join('');
    }
  }

  window.openAddCustomerModal = function () {
    document.getElementById('customerModalTitle').innerHTML = `<i class="fa-solid fa-user-plus"></i> Add New Customer`;
    document.getElementById('cmCustomerId').value = '';
    document.getElementById('customerForm').reset();
    openModal('customerModal');
  };

  window.openEditCustomerModal = function (id) {
    const cust = state.customers.find((c) => c.id === id);
    if (!cust) return;

    document.getElementById('customerModalTitle').innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Customer`;
    document.getElementById('cmCustomerId').value = cust.id;
    document.getElementById('cmName').value = cust.name;
    document.getElementById('cmPhone').value = cust.phone;
    document.getElementById('cmEmail').value = cust.email || '';
    document.getElementById('cmAddress').value = cust.address || '';
    openModal('customerModal');
  };

  async function handleCustomerFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('cmCustomerId').value;
    const name = document.getElementById('cmName').value;
    const phone = document.getElementById('cmPhone').value;
    const email = document.getElementById('cmEmail').value;
    const address = document.getElementById('cmAddress').value;

    const payload = { name, phone, email, address };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/customers/${id}` : '/api/customers';

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message, 'success');
        closeModal('customerModal');
        await fetchCustomers();
        renderCustomersView();
        renderPosCustomerSelector();
      } else {
        showToast(json.message || 'Error saving customer', 'error');
      }
    } catch (error) {
      showToast('Server error while saving customer', 'error');
    }
  }

  window.deleteCustomer = async function (id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const res = await authFetch(`/api/customers/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        showToast(json.message, 'success');
        await fetchCustomers();
        renderCustomersView();
        renderPosCustomerSelector();
      } else {
        showToast(json.message || 'Could not delete customer', 'error');
      }
    } catch (error) {
      showToast('Error deleting customer', 'error');
    }
  };

  // ==========================================================================
  // 11. BILLING HISTORY & PRINTABLE RECEIPT
  // ==========================================================================
  function renderHistoryView() {
    filterAndRenderHistory();
  }

  function filterAndRenderHistory() {
    const search = (document.getElementById('historySearchInput')?.value || '').toLowerCase();
    const method = document.getElementById('historyPaymentFilter')?.value || 'All';

    const filtered = state.bills.filter((b) => {
      const matchesSearch =
        b.invoice_number.toLowerCase().includes(search) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(search));
      const matchesMethod = method === 'All' || b.payment_method === method;
      return matchesSearch && matchesMethod;
    });

    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No invoice records found.</td></tr>`;
    } else {
      tbody.innerHTML = filtered
        .map(
          (b) => `
        <tr>
          <td><strong>${b.invoice_number}</strong></td>
          <td>${escapeHtml(b.customer_name || 'Walk-in Customer')}</td>
          <td>${new Date(b.bill_date).toLocaleDateString()}</td>
          <td>₹${parseFloat(b.subtotal).toFixed(2)}</td>
          <td>₹${parseFloat(b.discount).toFixed(2)}</td>
          <td>₹${parseFloat(b.gst).toFixed(2)}</td>
          <td class="text-cyan font-weight-bold">₹${parseFloat(b.grand_total).toFixed(2)}</td>
          <td><span class="badge badge-info">${b.payment_method}</span></td>
          <td class="text-right">
            <button class="btn btn-sm btn-ghost" onclick="viewInvoiceDetails(${b.id})">
              <i class="fa-solid fa-print"></i> View / Print
            </button>
            <button class="btn btn-sm btn-danger-ghost" onclick="deleteInvoice(${b.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `
        )
        .join('');
    }
  }

  window.viewInvoiceDetails = async function (id) {
    try {
      const res = await fetch(`/api/bills/${id}`);
      const json = await res.json();
      if (json.success) {
        openInvoicePrintModal(json.data);
      } else {
        showToast(json.message || 'Invoice details unavailable', 'error');
      }
    } catch (error) {
      showToast('Error loading invoice details', 'error');
    }
  };

  function openInvoicePrintModal(bill) {
    const container = document.getElementById('printableInvoiceContent');
    if (!container) return;

    const sett = state.settings;

    container.innerHTML = `
      <div class="invoice-header-row">
        <div class="inv-company">
          <h2>${escapeHtml(sett.storeName.split(' ')[0])} <span>${escapeHtml(sett.storeName.split(' ').slice(1).join(' '))}</span></h2>
          <p style="font-size:12px; color:#0284c7; font-weight:600;">${escapeHtml(sett.storeTagline)}</p>
          <p>${escapeHtml(sett.storeAddress)}</p>
          <p>Phone: ${escapeHtml(sett.storePhone)} | GSTIN: ${escapeHtml(sett.storeGst)}</p>
        </div>
        <div class="inv-details">
          <h3>TAX INVOICE RECEIPT</h3>
          <p><strong>Invoice #:</strong> ${bill.invoice_number}</p>
          <p><strong>Date & Time:</strong> ${new Date(bill.bill_date).toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${bill.payment_method}</p>
        </div>
      </div>

      <div class="inv-party-row">
        <div class="inv-bill-to">
          <h4 style="color:#64748b; font-size:11px; text-transform:uppercase;">Customer Details:</h4>
          <h3 style="font-size:16px; font-weight:700; margin-top:4px;">${escapeHtml(bill.customer_name || 'Walk-in Customer')}</h3>
          <p>${escapeHtml(bill.customer_phone || '')}</p>
        </div>
      </div>

      <table class="inv-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item Description</th>
            <th>SKU / Barcode</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            bill.items
              ? bill.items
                  .map(
                    (item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${escapeHtml(item.product_name)}</strong></td>
              <td>${escapeHtml(item.product_sku || `BPM-${item.product_id}`)}</td>
              <td>${item.quantity}</td>
              <td>₹${parseFloat(item.price).toFixed(2)}</td>
              <td>₹${parseFloat(item.total).toFixed(2)}</td>
            </tr>
          `
                  )
                  .join('')
              : '<tr><td colspan="6">No item details available</td></tr>'
          }
        </tbody>
      </table>

      <div class="inv-summary-block" style="display:flex; justify-content:flex-end;">
        <div class="inv-summary-box" style="width:280px;">
          <div class="inv-sum-row" style="display:flex; justify-content:space-between; padding:4px 0;">
            <span>Subtotal:</span>
            <span>₹${parseFloat(bill.subtotal).toFixed(2)}</span>
          </div>
          <div class="inv-sum-row" style="display:flex; justify-content:space-between; padding:4px 0;">
            <span>Discount:</span>
            <span>-₹${parseFloat(bill.discount).toFixed(2)}</span>
          </div>
          <div class="inv-sum-row" style="display:flex; justify-content:space-between; padding:4px 0;">
            <span>GST Tax:</span>
            <span>+₹${parseFloat(bill.gst).toFixed(2)}</span>
          </div>
          <div class="inv-sum-row grand-total" style="display:flex; justify-content:space-between; font-size:16px; font-weight:800; border-top:2px solid #0f172a; padding-top:8px; color:#0284c7;">
            <span>Grand Total:</span>
            <span>₹${parseFloat(bill.grand_total).toFixed(2)}</span>
          </div>
          ${
            bill.payment_method === 'Cash'
              ? `
            <div class="inv-sum-row" style="display:flex; justify-content:space-between; padding:4px 0; font-size:12px;">
              <span>Amount Received:</span>
              <span>₹${parseFloat(bill.amount_received || bill.grand_total).toFixed(2)}</span>
            </div>
            <div class="inv-sum-row" style="display:flex; justify-content:space-between; padding:4px 0; font-size:12px; font-weight:700; color:#10b981;">
              <span>Change Returned:</span>
              <span>₹${parseFloat(bill.change_returned || 0).toFixed(2)}</span>
            </div>
          `
              : ''
          }
        </div>
      </div>

      <div class="inv-footer-note" style="margin-top:28px; padding-top:16px; border-top:1px solid #e2e8f0; text-align:center; color:#64748b; font-size:12px;">
        <p>Thank you for shopping with ${escapeHtml(sett.storeName)}!</p>
        <p style="font-size:11px; margin-top:4px;">Computer generated retail POS tax invoice receipt.</p>
      </div>
    `;

    openModal('invoiceViewModal');
  }

  window.deleteInvoice = async function (id) {
    if (!confirm('Are you sure you want to delete this invoice? Stock will be restored.')) return;

    try {
      const res = await authFetch(`/api/bills/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (json.success) {
        showToast(json.message, 'success');
        await fetchBills();
        await fetchProducts();
        renderHistoryView();
        renderPosProductsGrid();
      } else {
        showToast(json.message || 'Could not delete invoice', 'error');
      }
    } catch (error) {
      showToast('Error deleting invoice', 'error');
    }
  };

  // ==========================================================================
  // 12. GLOBAL EVENT BINDINGS
  // ==========================================================================
  function initGlobalEvents() {
    const scannerInput = document.getElementById('posBarcodeScanner');
    if (scannerInput) {
      scannerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleBarcodeScan();
        }
      });
    }

    const btnScan = document.getElementById('btnScanBarcode');
    if (btnScan) btnScan.addEventListener('click', handleBarcodeScan);

    const posSearch = document.getElementById('posProductSearch');
    if (posSearch) posSearch.addEventListener('input', () => renderPosProductsGrid());

    const posDiscount = document.getElementById('posDiscount');
    const posGstPercent = document.getElementById('posGstPercent');
    if (posDiscount) posDiscount.addEventListener('input', calculatePosTotals);
    if (posGstPercent) posGstPercent.addEventListener('input', calculatePosTotals);

    const payAmountInput = document.getElementById('payAmountReceived');
    if (payAmountInput) payAmountInput.addEventListener('input', updateCashChange);

    const ownerLoginForm = document.getElementById('ownerLoginForm');
    if (ownerLoginForm) ownerLoginForm.addEventListener('submit', handleOwnerLoginFormSubmit);

    const productForm = document.getElementById('productForm');
    if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);

    const customerForm = document.getElementById('customerForm');
    if (customerForm) customerForm.addEventListener('submit', handleCustomerFormSubmit);

    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.settings.storeName = document.getElementById('settStoreName').value;
        state.settings.storeTagline = document.getElementById('settStoreTagline').value;
        state.settings.storeGst = document.getElementById('settStoreGst').value;
        state.settings.storePhone = document.getElementById('settStorePhone').value;
        state.settings.storeAddress = document.getElementById('settStoreAddress').value;
        showToast('Branding settings saved', 'success');
      });
    }
  }

  window.testDatabaseConnection = async function () {
    const settBadge = document.getElementById('settDbBadge');
    if (settBadge) {
      settBadge.className = 'badge badge-warning';
      settBadge.textContent = 'Testing...';
    }

    try {
      const res = await fetch('/api/health');
      const data = await res.json();

      if (data && data.database && data.database.connected) {
        if (settBadge) {
          settBadge.className = 'badge badge-success';
          settBadge.textContent = 'CONNECTED (MySQL 8+)';
        }
        showToast('Database connection test passed successfully!', 'success');
      } else {
        if (settBadge) {
          settBadge.className = 'badge badge-danger';
          settBadge.textContent = 'DISCONNECTED';
        }
        showToast(data.database ? data.database.message : 'Database error', 'error');
      }
    } catch (err) {
      if (settBadge) {
        settBadge.className = 'badge badge-danger';
        settBadge.textContent = 'UNREACHABLE';
      }
      showToast('Backend server unreachable', 'error');
    }
  };

  window.openModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  };

  window.closeModal = function (modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  };

  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '<i class="fa-solid fa-circle-check text-success"></i>',
      error: '<i class="fa-solid fa-circle-xmark text-danger"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation text-warning"></i>',
      info: '<i class="fa-solid fa-circle-info text-cyan"></i>'
    };

    toast.innerHTML = `${icons[type] || icons.info} <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});

(function(){
  // for  format
  const formatCurrency = (val) => '$' + Number(val).toFixed(2);

  // Element
  const navInventoryBtn = document.getElementById('nav-inventory');
  const navInvoiceBtn = document.getElementById('nav-invoice');
  const navDashboardBtn = document.getElementById('nav-dashboard');

  const inventorySection = document.getElementById('inventory-section');
  const invoiceSection = document.getElementById('invoice-section');
  const dashboardSection = document.getElementById('dashboard-section');

  const addItemForm = document.getElementById('add-item-form');
  const itemNameInput = document.getElementById('item-name');
  const itemQuantityInput = document.getElementById('item-quantity');
  const itemBuyingPriceInput = document.getElementById('item-buying-price');

  const inventorySearchInput = document.getElementById('inventory-search');
  const inventoryList = document.getElementById('inventory-list');
  const inventoryTotalAmountDisplay = document.getElementById('inventory-total-amount-display');

  const invoiceItemSelect = document.getElementById('invoice-item-select');
  const invoiceQuantityInput = document.getElementById('invoice-quantity');
  const invoiceSellingPriceInput = document.getElementById('invoice-selling-price');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const invoiceCartList = document.getElementById('invoice-cart-list');
  const invoiceTotalDisplay = document.getElementById('invoice-total-display');
  const finalizeInvoiceBtn = document.getElementById('finalize-invoice-btn');
  const printInvoiceBtn = document.getElementById('print-invoice-btn');

  const dashboardTotalSales = document.getElementById('dashboard-total-sales');
  const dashboardTotalEarnings = document.getElementById('dashboard-total-earnings');
  const dashboardTotalProfit = document.getElementById('dashboard-total-profit');
  const resetSalesBtn = document.getElementById('reset-sales-btn');

  const growthChartCanvas = document.getElementById('growth-chart').getContext('2d');

  const printableInvoiceSection = document.getElementById('printable-invoice');
  const printInvoiceItemsTbody = document.getElementById('print-invoice-items');
  const printInvoiceTotalProfit = document.getElementById('print-invoice-total-profit');

  // Storage key
  const STORAGE_KEYS = {
    INVENTORY: 'offlineInventoryItems',
    SALES: 'offlineSalesRecords'
  };

  // Current stat
  let inventoryItems = [];
  let salesRecords = [];
  let invoiceCart = [];

  let growthChart = null;

  // Utility functions
  function saveInventory() {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventoryItems));
  }
  function saveSales() {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(salesRecords));
  }
  function loadInventory() {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if(data) {
      try {
        inventoryItems = JSON.parse(data);
      } catch(e) {
        inventoryItems = [];
      }
    } else {
      inventoryItems = [];
    }
  }
  function loadSales() {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    if(data) {
      try {
        salesRecords = JSON.parse(data);
      } catch(e) {
        salesRecords = [];
      }
    } else {
      salesRecords = [];
    }
  }
  function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  // Navigation
  function setActiveSection(section) {
    inventorySection.classList.remove('active');
    invoiceSection.classList.remove('active');
    dashboardSection.classList.remove('active');
    navInventoryBtn.classList.remove('active');
    navInvoiceBtn.classList.remove('active');
    navDashboardBtn.classList.remove('active');

    if(section === 'inventory') {
      inventorySection.classList.add('active');
      navInventoryBtn.classList.add('active');
    } else if(section === 'invoice') {
      invoiceSection.classList.add('active');
      navInvoiceBtn.classList.add('active');
    } else if(section === 'dashboard') {
      dashboardSection.classList.add('active');
      navDashboardBtn.classList.add('active');
      updateGrowthChart();
    }
  }

  navInventoryBtn.addEventListener('click', () => setActiveSection('inventory'));
  navInvoiceBtn.addEventListener('click', () => setActiveSection('invoice'));
  navDashboardBtn.addEventListener('click', () => setActiveSection('dashboard'));

  // Inventory Display

  function renderInventory(filter='') {
    inventoryList.innerHTML = '';
    const filteredItems = inventoryItems.filter(item => item.name.toLowerCase().includes(filter.toLowerCase()));
    if(filteredItems.length === 0) {
      inventoryList.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#777;">No items found</td></tr>`;
      return;
    }
    for(const item of filteredItems) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.buyingPrice)}</td>
        <td><button class="delete-btn" aria-label="Delete item ${item.name}" data-id="${item.id}">Delete</button></td>
      `;
      inventoryList.appendChild(tr);
    }
    updateInventoryTotalAmount();
  }

  function renderInvoiceItemOptions() {
    invoiceItemSelect.innerHTML = '<option value="">-- Select Item --</option>';
    const availableItems = inventoryItems.filter(item => item.quantity > 0);
    for(const item of availableItems) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.name} (Available: ${item.quantity})`;
      invoiceItemSelect.appendChild(option);
    }
  }

  // Add new 
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const quantity = parseInt(itemQuantityInput.value);
    const buyingPrice = parseFloat(itemBuyingPriceInput.value);

    if(!name || isNaN(quantity) || quantity < 1 || isNaN(buyingPrice) || buyingPrice < 0) {
      alert('Please enter valid item details.');
      return;
    }

    const existingIndex = inventoryItems.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
    if(existingIndex !== -1) {
      let existingItem = inventoryItems[existingIndex];
      const totalQty = existingItem.quantity + quantity;
      const avgBuyingPrice = ((existingItem.buyingPrice * existingItem.quantity) + (buyingPrice * quantity)) / totalQty;
      existingItem.quantity = totalQty;
      existingItem.buyingPrice = avgBuyingPrice;
      inventoryItems[existingIndex] = existingItem;
    } else {
      const newItem = {
        id: generateId(),
        name: name,
        quantity: quantity,
        buyingPrice: buyingPrice
      };
      inventoryItems.push(newItem);
    }
    saveInventory();
    renderInventory(inventorySearchInput.value);
    renderInvoiceItemOptions();
    addItemForm.reset();
  });

  // Delete from inventory
  inventoryList.addEventListener('click', e => {
    if(e.target.classList.contains('delete-btn')) {
      const id = e.target.getAttribute('data-id');
      const index = inventoryItems.findIndex(i => i.id === id);
      if(index !== -1) {
        if(confirm(`Are you sure you want to delete "${inventoryItems[index].name}" from inventory?`)) {
          invoiceCart = invoiceCart.filter(i => i.id !== id);
          inventoryItems.splice(index, 1);
          saveInventory();
          renderInventory(inventorySearchInput.value);
          renderInvoiceItemOptions();
          renderInvoiceCart();
          updateInvoiceTotal();
          updateDashboard();
          updatePrintInvoice();
          updateInventoryTotalAmount();
        }
      }
    }
  });

  // Search inventory
  inventorySearchInput.addEventListener('input', (e) => {
    renderInventory(e.target.value);
  });

  // Calculate and update total inventory amount
  function updateInventoryTotalAmount() {
    const totalAmount = inventoryItems.reduce((acc, item) => acc + (item.quantity * item.buyingPrice), 0);
    inventoryTotalAmountDisplay.textContent = `Total Inventory Amount: ${formatCurrency(totalAmount)}`;
  }

  // Invoice functions 
  // This Software is a proejct prototype created by MD. Shajidul Hoque. 

  // Add to invoice
  addToCartBtn.addEventListener('click', () => {
    const itemId = invoiceItemSelect.value;
    const sellQty = parseInt(invoiceQuantityInput.value);
    const sellingPrice = parseFloat(invoiceSellingPriceInput.value);

    if(!itemId) {
      alert('Please select an item.');
      return;
    }
    if(isNaN(sellQty) || sellQty < 1) {
      alert('Enter a valid quantity (at least 1).');
      return;
    }
    if(isNaN(sellingPrice) || sellingPrice < 0) {
      alert('Enter a valid selling price.');
      return;
    }

    const item = inventoryItems.find(i => i.id === itemId);
    if(!item) {
      alert('Selected item not found.');
      return;
    }
    if(sellQty > item.quantity) {
      alert(`Not enough quantity available. You have ${item.quantity} available.`);
      return;
    }

    const existingIndex = invoiceCart.findIndex(cartItem =>
      cartItem.id === itemId && cartItem.sellingPrice === sellingPrice
    );
    if(existingIndex !== -1) {
      invoiceCart[existingIndex].quantity += sellQty;
    } else {
      invoiceCart.push({
        id: itemId,
        name: item.name,
        buyingPrice: item.buyingPrice,
        quantity: sellQty,
        sellingPrice: sellingPrice
      });
    }

    invoiceItemSelect.value = '';
    invoiceQuantityInput.value = 1;
    invoiceSellingPriceInput.value = '';

    renderInvoiceCart();
    updateInvoiceTotal();
    finalizeInvoiceBtn.disabled = invoiceCart.length === 0;
    printInvoiceBtn.disabled = invoiceCart.length === 0;
    updatePrintInvoice();
  });

  // Render invoice cart table
  function renderInvoiceCart() {
    invoiceCartList.innerHTML = '';
    if(invoiceCart.length === 0) {
      invoiceCartList.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#777;">No items in invoice cart</td></tr>`;
      return;
    }
    for(let i = 0; i < invoiceCart.length; i++) {
      const ci = invoiceCart[i];
      const profit = (ci.sellingPrice - ci.buyingPrice) * ci.quantity;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ci.name}</td>
        <td>${ci.quantity}</td>
        <td>${formatCurrency(ci.buyingPrice)}</td>
        <td>${formatCurrency(ci.sellingPrice)}</td>
        <td>${formatCurrency(profit)}</td>
        <td><button class="remove-cart-btn" aria-label="Remove ${ci.name} from invoice cart" data-index="${i}">Remove</button></td>
      `;
      invoiceCartList.appendChild(tr);
    }
  }

  // Remove from invoice cart
  invoiceCartList.addEventListener('click', e => {
    if(e.target.classList.contains('remove-cart-btn')) {
      const idx = parseInt(e.target.getAttribute('data-index'));
      if(!isNaN(idx)) {
        invoiceCart.splice(idx, 1);
        renderInvoiceCart();
        updateInvoiceTotal();
        finalizeInvoiceBtn.disabled = invoiceCart.length === 0;
        printInvoiceBtn.disabled = invoiceCart.length === 0;
        updatePrintInvoice();
      }
    }
  });

  // Calculate and update invoice total profit display
  function updateInvoiceTotal() {
    const totalProfit = invoiceCart.reduce((acc, ci) => acc + ((ci.sellingPrice - ci.buyingPrice) * ci.quantity), 0);
    invoiceTotalDisplay.textContent = `Total Profit: ${formatCurrency(totalProfit)}`;
  }

  // Finalize invoice: Update inventory and sales records then clear invoice cart
  finalizeInvoiceBtn.addEventListener('click', () => {
    if(invoiceCart.length === 0) return;

    let canProceed = true;
    for(const ci of invoiceCart) {
      const invItem = inventoryItems.find(i => i.id === ci.id);
      if(!invItem || invItem.quantity < ci.quantity) {
        alert(`Not enough quantity for item "${ci.name}". Please adjust invoice.`);
        canProceed = false;
        break;
      }
    }
    if(!canProceed) return;

    for(const ci of invoiceCart) {
      const invItem = inventoryItems.find(i => i.id === ci.id);
      invItem.quantity -= ci.quantity;
    }

    const timestamp = Date.now();
    for(const ci of invoiceCart) {
      salesRecords.push({
        id: ci.id,
        name: ci.name,
        buyingPrice: ci.buyingPrice,
        sellingPrice: ci.sellingPrice,
        quantity: ci.quantity,
        profit: (ci.sellingPrice - ci.buyingPrice) * ci.quantity,
        timestamp: timestamp
      });
    }

    saveInventory();
    saveSales();

    invoiceCart = [];
    renderInvoiceCart();
    updateInvoiceTotal();
    renderInventory(inventorySearchInput.value);
    renderInvoiceItemOptions();
    finalizeInvoiceBtn.disabled = true;
    printInvoiceBtn.disabled = true;
    updateDashboard();
    updatePrintInvoice();
    updateInventoryTotalAmount(); // Update inventory total after sale
    alert('Sale finalized successfully!');
  });

  // Dashboard updates
  function updateDashboard() {
    const totalSales = salesRecords.reduce((acc, s) => acc + s.quantity, 0);
    const totalEarnings = salesRecords.reduce((acc, s) => acc + (s.sellingPrice * s.quantity), 0);
    const totalProfit = salesRecords.reduce((acc, s) => acc + s.profit, 0);

    dashboardTotalSales.textContent = totalSales;
    dashboardTotalEarnings.textContent = formatCurrency(totalEarnings);
    dashboardTotalProfit.textContent = formatCurrency(totalProfit);
  }

  // Reset sales data and refresh dashboard
  resetSalesBtn.addEventListener('click', () => {
    if(confirm('This will clear all sales and profit data. Are you sure?')) {
      salesRecords = [];
      saveSales();
      updateDashboard();
      updateGrowthChart();
    }
  });

  // Print invoice functionality
  printInvoiceBtn.addEventListener('click', () => {
    if(invoiceCart.length === 0) return;
    updatePrintInvoice();
    window.print();
  });

  // Update printable invoice content from current invoiceCart
  function updatePrintInvoice() {
    printInvoiceItemsTbody.innerHTML = '';
    if(invoiceCart.length === 0) {
      printInvoiceItemsTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;">No items in invoice cart</td></tr>';
      printInvoiceTotalProfit.textContent = formatCurrency(0);
      return;
    }
    let totalProfit = 0;
    for(const ci of invoiceCart) {
      const profit = (ci.sellingPrice - ci.buyingPrice) * ci.quantity;
      totalProfit += profit;
      const totalSaleAmount = ci.sellingPrice * ci.quantity;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ci.name}</td>
        <td>${ci.quantity}</td>
        <td>${formatCurrency(ci.buyingPrice)}</td>
        <td>${formatCurrency(ci.sellingPrice)}</td>
        <td>${formatCurrency(profit)}</td>
        <td>${formatCurrency(totalSaleAmount)}</td>
      `;
      printInvoiceItemsTbody.appendChild(tr);
    }
    printInvoiceTotalProfit.textContent = formatCurrency(totalProfit);
  }

  // Business Growth Chart update
  function updateGrowthChart() {
    // Aggregate sales profit by day (YYYY-MM-DD)
    if(!salesRecords.length) {
      if(growthChart) {
        growthChart.destroy();
        growthChart = null;
      }
      return;
    }
    // Aggregate profits by day
    const profitsByDate = {};
    salesRecords.forEach(sale => {
      const d = new Date(sale.timestamp);
      // Format as YYYY-MM-DD
      const dayStr = d.toISOString().slice(0,10);
      if(!profitsByDate[dayStr]) profitsByDate[dayStr] = 0;
      profitsByDate[dayStr] += sale.profit;
    });
    // Sort dates ascending
    const sortedDates = Object.keys(profitsByDate).sort();

    // Calculate cumulative profit for each date
    const cumulativeProfits = [];
    let runningSum = 0;
    for(const d of sortedDates) {
      runningSum += profitsByDate[d];
      cumulativeProfits.push({ date: d, profit: runningSum });
    }

    const labels = cumulativeProfits.map(o => o.date);
    const data = cumulativeProfits.map(o => o.profit.toFixed(2));

    if(growthChart) {
      growthChart.data.labels = labels;
      growthChart.data.datasets[0].data = data;
      growthChart.update();
    } else {
      growthChart = new Chart(growthChartCanvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Cumulative Profit ($)',
            data: data,
            fill: true,
            borderColor: '#5a6cef',
            backgroundColor: 'rgba(90,108,239,0.32)',
            pointBackgroundColor: '#3f51b5',
            pointRadius: 5,
            tension: 0.28,
            borderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, labels: { color: '#2c3e50', font: { weight: '600' } }},
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date',
                color: '#34495e',
                font: { weight: '600' }
              },
              ticks: { color: '#5069d8', maxRotation: 90, minRotation: 45 }
            },
            y: {
              title: {
                display: true,
                text: 'Profit ($)',
                color: '#34495e',
                font: { weight: '600' }
              },
              ticks: { color: '#5069d8' },
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  // Initialization
  function init() {
    loadInventory();
    loadSales();
    renderInventory();
    renderInvoiceItemOptions();
    renderInvoiceCart();
    updateInvoiceTotal();
    updateDashboard();
    updatePrintInvoice();
    updateInventoryTotalAmount(); // Initial call to display total inventory amount
    finalizeInvoiceBtn.disabled = true;
    printInvoiceBtn.disabled = true;
  }

  init();

})();

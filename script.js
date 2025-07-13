const menuItems = [
    { name: "มัทฉะน้ำมะพร้าว", price: 45 },
    { name: "ชาไทย", price: 30 },
    { name: "ชาเขียว", price: 30 },
    { name: "โกโก้นมสด", price: 35 },
    { name: "อเมริกาโน่มะพร้าว", price: 45 },
    { name: "อเมริกาโน่ส้ม", price: 45 },
    { name: "อเมริกาโน่น้ำผึ้งมะนาว", price: 45 }, // แก้ราคาจาก 5 เป็น 45 บาท
    { name: "คาราเมลมัคคิอาโต้", price: 50 },
    { name: "เอสเปรสโซ่", price: 45 },
    { name: "คาปูชิโน่", price: 45 },
    { name: "ลาเต้", price: 45 },
    { name: "มอคค่า", price: 45 },
    { name: "อเมริกาโน่", price: 35 },
    { name: "เพียวมัทฉะ", price: 40 },
    { name: "มัทฉะลาเต้", price: 45 },
    { name: "มัทฉะน้ำส้ม", price: 45 },
    { name: "มัทฉะน้ำผึ้งมะนาว", price: 45 },
    { name: "เลม่อนน้ำผึ้งโซดา", proce: 35}
];

let currentOrder = [];
let salesHistory = []; // Stores all sales records

// DOM Elements
const menuItemsGrid = document.querySelector('.menu-items-grid');
const orderList = document.getElementById('order-list');
const orderTotalSpan = document.getElementById('order-total-span');
const posSection = document.getElementById('pos-section');
const historySection = document.getElementById('history-section');
const posNavBtn = document.getElementById('posNavBtn');
const historyNavBtn = document.getElementById('historyNavBtn');
const historyDatePicker = document.getElementById('history-date-picker');

const dailyTotalSales = document.getElementById('daily-total-sales');
const dailyCashSales = document.getElementById('daily-cash-sales');
const dailyTransferSales = document.getElementById('daily-transfer-sales');
const salesListTableBody = document.getElementById('sales-list-table-body');

// --- Initialization and Data Loading ---

document.addEventListener('DOMContentLoaded', () => {
    loadSalesHistory();
    renderMenuItems();
    renderOrder();
    
    // Set today's date for the date picker and render history
    const today = new Date();
    historyDatePicker.value = formatDateForInput(today);
    renderSalesHistory(today);
});

historyDatePicker.addEventListener('change', (event) => {
    const selectedDate = new Date(event.target.value);
    renderSalesHistory(selectedDate);
});

// --- Local Storage Functions ---

function saveSalesHistory() {
    localStorage.setItem('posSalesHistory', JSON.stringify(salesHistory));
}

function loadSalesHistory() {
    const storedHistory = localStorage.getItem('posSalesHistory');
    if (storedHistory) {
        salesHistory = JSON.parse(storedHistory);
    }
}

// --- POS Functions ---

function renderMenuItems() {
    menuItemsGrid.innerHTML = '';
    menuItems.forEach(item => {
        const button = document.createElement('button');
        button.classList.add('menu-button');
        button.innerHTML = `
            <span>${item.name}</span>
            <span>${item.price} บาท</span>
        `;
        button.onclick = () => addItemToOrder(item);
        menuItemsGrid.appendChild(button);
    });
}

function addItemToOrder(item) {
    const existingItem = currentOrder.find(orderItem => orderItem.name === item.name);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        currentOrder.push({ ...item, quantity: 1 }); // Create a copy of item
    }
    renderOrder();
}

function updateItemQuantity(index, change) {
    if (currentOrder[index]) {
        currentOrder[index].quantity += change;
        if (currentOrder[index].quantity <= 0) {
            currentOrder.splice(index, 1); // Remove if quantity is 0 or less
        }
    }
    renderOrder();
}

function removeItemFromOrder(index) {
    currentOrder.splice(index, 1);
    renderOrder();
}

function renderOrder() {
    orderList.innerHTML = '';
    let total = 0;

    if (currentOrder.length === 0) {
        orderList.innerHTML = '<li style="text-align: center; color: #888; padding: 20px;">ยังไม่มีรายการในออเดอร์</li>';
    } else {
        currentOrder.forEach((item, index) => {
            const li = document.createElement('li');
            const itemTotalPrice = item.price * item.quantity;
            total += itemTotalPrice;

            li.innerHTML = `
                <div class="item-details">
                    ${item.name} (${item.price} บาท)
                </div>
                <div class="item-quantity-control">
                    <button onclick="updateItemQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateItemQuantity(${index}, 1)">+</button>
                </div>
                <div>
                    ${itemTotalPrice.toFixed(2)} บาท
                </div>
                <button class="remove-item-btn" onclick="removeItemFromOrder(${index})">X</button>
            `;
            orderList.appendChild(li);
        });
    }
    orderTotalSpan.textContent = total.toFixed(2);
}

function completeSale(paymentType) {
    if (currentOrder.length === 0) {
        alert('กรุณาเพิ่มรายการสินค้าในออเดอร์ก่อนค่ะ');
        return;
    }

    const totalAmount = parseFloat(orderTotalSpan.textContent);
    const sale = {
        timestamp: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(currentOrder)), // Deep copy of current order items
        totalAmount: totalAmount,
        paymentType: paymentType
    };

    salesHistory.push(sale);
    saveSalesHistory();

    currentOrder = []; // Clear current order
    renderOrder(); // Update POS display

    alert(`ชำระเงินเรียบร้อยแล้ว (${paymentType}) ยอดรวม ${totalAmount.toFixed(2)} บาท`);
    
    // After completing a sale, re-render history for today
    const today = new Date();
    historyDatePicker.value = formatDateForInput(today); // Ensure date picker shows today
    renderSalesHistory(today); // Update history view
}

// --- Sales History Functions ---

function renderSalesHistory(date) {
    const selectedDateString = formatDateToYYYYMMDD(date);
    
    const salesForSelectedDate = salesHistory.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return formatDateToYYYYMMDD(saleDate) === selectedDateString;
    });

    let dailyCash = 0;
    let dailyTransfer = 0;
    let dailyTotal = 0;

    salesListTableBody.innerHTML = ''; // Clear previous entries

    if (salesForSelectedDate.length === 0) {
        salesListTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888; padding: 20px;">ไม่มีรายการขายสำหรับวันนี้</td></tr>';
    } else {
        salesForSelectedDate.forEach(sale => {
            dailyTotal += sale.totalAmount;
            if (sale.paymentType === 'Cash') {
                dailyCash += sale.totalAmount;
            } else if (sale.paymentType === 'Transfer') {
                dailyTransfer += sale.totalAmount;
            }

            const tr = document.createElement('tr');
            const saleTime = new Date(sale.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            
            // Format items for display in table
            const itemDetails = sale.items.map(item => `${item.name} (${item.quantity})`).join('<br>');

            tr.innerHTML = `
                <td>${saleTime}</td>
                <td>${itemDetails}</td>
                <td>${sale.totalAmount.toFixed(2)}</td>
                <td>${sale.paymentType === 'Cash' ? 'เงินสด' : 'โอน'}</td>
            `;
            salesListTableBody.appendChild(tr);
        });
    }

    dailyTotalSales.textContent = dailyTotal.toFixed(2) + ' บาท';
    dailyCashSales.textContent = dailyCash.toFixed(2) + ' บาท';
    dailyTransferSales.textContent = dailyTransfer.toFixed(2) + ' บาท';
}

// --- Utility Functions ---

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForInput(date) {
    return formatDateToYYYYMMDD(date);
}

// --- Page Navigation ---

function showPage(pageName) {
    posSection.classList.remove('active');
    historySection.classList.remove('active');
    posNavBtn.classList.remove('active');
    historyNavBtn.classList.remove('active');

    if (pageName === 'pos') {
        posSection.classList.add('active');
        posNavBtn.classList.add('active');
    } else if (pageName === 'history') {
        historySection.classList.add('active');
        historyNavBtn.classList.add('active');
        // Ensure history is updated when switching to this tab
        const currentSelectedDate = historyDatePicker.value;
        if (currentSelectedDate) {
            renderSalesHistory(new Date(currentSelectedDate));
        } else {
            renderSalesHistory(new Date()); // Default to today if nothing selected
        }
    }
}
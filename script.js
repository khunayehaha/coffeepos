// script.js

const menuItems = [
    { name: "มัทฉะน้ำมะพร้าว", price: 45 },
    { name: "ชาไทย", price: 30 },
    { name: "ชาเขียว", price: 30 },
    { name: "โกโก้นมสด", price: 35 },
    { name: "อเมริกาโน่มะพร้าว", price: 45 },
    { name: "อเมริกาโน่ส้ม", price: 45 },
    { name: "อเมริกาโน่น้ำผึ้งมะนาว", price: 45 },
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
    { name: "เลม่อนดองน้ำผึ้งโซดา", price: 35 },
    { name: "เปลี่ยนนม OAT", price: 10 },
    { name: "เพิ่ม SHOT กาแฟ", price: 10},
    { name: "ลูกค้านำแก้วมาเอง", price: -5 } // ***** แก้ไขตรงนี้เป็น -5 บาท *****
];

let currentOrder = [];
let salesHistory = []; // Stores all sales records

// Global variable for Chart.js instance (ย้ายมาที่นี่)
let productSalesChartInstance = null;

// DOM Elements
const menuItemsGrid = document.querySelector('.menu-items-grid');
const orderList = document.getElementById('order-list');
const orderTotalSpan = document.getElementById('order-total-span');
const posSection = document.getElementById('pos-section');
const historySection = document.getElementById('history-section');
const monthlySection = document.getElementById('monthly-section'); // New: Monthly Section

const posNavBtn = document.getElementById('posNavBtn');
const historyNavBtn = document.getElementById('historyNavBtn');
const monthlyNavBtn = document.getElementById('monthlyNavBtn'); // New: Monthly Nav Button

const historyDatePicker = document.getElementById('history-date-picker');

const dailyTotalSales = document.getElementById('daily-total-sales');
const dailyCashSales = document.getElementById('daily-cash-sales');
const dailyTransferSales = document.getElementById('daily-transfer-sales');
const salesListTableBody = document.getElementById('sales-list-table-body');

// New: Monthly Report DOM Elements
const monthlyTotalSales = document.getElementById('monthly-total-sales');
const monthlyCashSales = document.getElementById('monthly-cash-sales');
const monthlyTransferSales = document.getElementById('monthly-transfer-sales');
const productSalesChartCanvas = document.getElementById('productSalesChart');

// --- Initialization and Data Loading ---

document.addEventListener('DOMContentLoaded', () => {
    loadSalesHistory(); // โหลดข้อมูลและทำการ prune ข้อมูลเก่าออก
    renderMenuItems();
    renderOrder();
    
    // Set today's date for the date picker and render history
    const today = new Date();
    historyDatePicker.value = formatDateForInput(today);
    renderSalesHistory(today); // แสดงข้อมูลรายวันของวันนี้

    // ไม่ต้องเรียก renderMonthlyReport() ตรงนี้ใน DOMContentLoaded
    // เพราะเราจะเรียกมันเมื่อแท็บ 'monthly' ถูกเปิดใช้งาน
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
    // New: Prune old data to keep only last 30 days
    pruneSalesHistory();
}

function pruneSalesHistory() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); // ย้อนไป 30 วันจากปัจจุบัน
    // กรองเอาเฉพาะข้อมูลที่มี timestamp มากกว่าหรือเท่ากับ 30 วันที่แล้ว
    salesHistory = salesHistory.filter(sale => new Date(sale.timestamp) >= thirtyDaysAgo);
    saveSalesHistory(); // บันทึกข้อมูลที่ถูก prune แล้วกลับลง Local Storage
    console.log(`Sales history pruned. Keeping data from: ${thirtyDaysAgo.toLocaleDateString('th-TH')}`);
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
    // โค้ดส่วนนี้ทำงานได้ดีอยู่แล้วแม้จะมีราคาติดลบ
    // ถ้าสินค้า (item.name) มีอยู่ในตะกร้าแล้ว ให้เพิ่มจำนวน
    // ถ้ายังไม่มีในตะกร้า ให้เพิ่มเข้าไปใหม่
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
            const itemTotalPrice = item.price * item.quantity; // item.price จะเป็น -5 ถ้าเป็น "ลูกค้านำแก้วมาเอง"

            // คำนวณยอดรวม ซึ่งจะรวมค่าติดลบเข้าไปด้วย
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
    // 1. ตรวจสอบว่ามีรายการในออเดอร์หรือไม่
    if (currentOrder.length === 0) {
        alert('กรุณาเพิ่มรายการสินค้าในออเดอร์ก่อนค่ะ');
        return;
    }

    const totalAmount = parseFloat(orderTotalSpan.textContent);
    let finalAlertMessage = ''; // ตัวแปรสำหรับเก็บข้อความแจ้งเตือนสุดท้าย

    // ตรวจสอบประเภทการชำระเงิน
    if (paymentType === 'Cash') {
        const amountPaidStr = prompt(`ยอดรวมที่ต้องชำระ: ${totalAmount.toFixed(2)} บาท\nกรุณาใส่จำนวนเงินที่ลูกค้าจ่ายมา:`);

        if (amountPaidStr === null) {
            return; // ยกเลิกการทำรายการ
        }

        const amountPaid = parseFloat(amountPaidStr);

        if (isNaN(amountPaid) || amountPaid < totalAmount) {
            alert('จำนวนเงินที่รับไม่ถูกต้อง หรือน้อยกว่ายอดรวมที่ต้องชำระ กรุณาลองอีกครั้ง');
            return;
        }

        const change = amountPaid - totalAmount;
        const confirmMessage = `ยืนยันการชำระเงินสด?\nยอดรวม: ${totalAmount.toFixed(2)} บาท\nเงินที่ได้รับ: ${amountPaid.toFixed(2)} บาท\nเงินทอน: ${change.toFixed(2)} บาท`;
        const confirmed = confirm(confirmMessage);

        if (!confirmed) {
            return;
        }
        
        finalAlertMessage = `ชำระเงินสดเรียบร้อยแล้ว\nยอดรวม: ${totalAmount.toFixed(2)} บาท\nเงินที่ได้รับ: ${amountPaid.toFixed(2)} บาท\nเงินทอน: ${change.toFixed(2)} บาท`;

    } else if (paymentType === 'Transfer') {
        const confirmed = confirm(`ยืนยันการชำระเงินโอน ยอดรวม ${totalAmount.toFixed(2)} บาท ใช่หรือไม่?`);
        
        if (!confirmed) {
            return;
        }
        finalAlertMessage = `ชำระเงินโอนเรียบร้อยแล้ว ยอดรวม ${totalAmount.toFixed(2)} บาท`;
    } else {
        alert('ไม่รองรับวิธีการชำระเงินนี้');
        return;
    }

    const sale = {
        timestamp: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(currentOrder)), // Deep copy ของรายการสินค้า
        totalAmount: totalAmount,
        paymentType: paymentType
    };

    salesHistory.push(sale); // เพิ่มรายการขายเข้าประวัติ
    saveSalesHistory();      // บันทึกประวัติลง Local Storage

    currentOrder = []; // ล้างออเดอร์ปัจจุบัน
    renderOrder();     // อัปเดตการแสดงผลหน้า POS

    alert(finalAlertMessage);
    
    // หลังจากทำรายการขายเสร็จสิ้น ให้อัปเดตประวัติการขายสำหรับวันนี้และภาพรวมรายเดือน
    const today = new Date();
    historyDatePicker.value = formatDateForInput(today); // ตั้งค่า Date Picker เป็นวันนี้
    renderSalesHistory(today); // แสดงประวัติการขายสำหรับวันนี้
    // ไม่ต้องเรียก renderMonthlyReport() ตรงนี้ เพราะมันจะถูกเรียกเมื่อแท็บถูก activate
}


// --- Sales History Functions (Daily) ---

function renderSalesHistory(date) {
    const selectedDateString = formatDateToYYYYMMDD(date);
    
    // กรองเฉพาะยอดขายของวันนั้นๆ
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


// --- New: Monthly Report Functions ---

function renderMonthlyReport() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); // ย้อนไป 30 วันจากปัจจุบัน

    // กรองยอดขายที่อยู่ในช่วง 30 วันย้อนหลัง
    const monthlySales = salesHistory.filter(sale => new Date(sale.timestamp) >= thirtyDaysAgo);

    let totalSales = 0;
    let cashSales = 0;
    let transferSales = 0;
    const productQuantities = {}; // Object to store quantity of each product

    if (monthlySales.length === 0) {
        // Handle case with no sales in the last 30 days
        monthlyTotalSales.textContent = '0.00 บาท';
        monthlyCashSales.textContent = '0.00 บาท';
        monthlyTransferSales.textContent = '0.00 บาท';
        drawProductSalesPieChart({}); // Draw empty chart
        return;
    }

    monthlySales.forEach(sale => {
        totalSales += sale.totalAmount;
        if (sale.paymentType === 'Cash') {
            cashSales += sale.totalAmount;
        } else if (sale.paymentType === 'Transfer') {
            transferSales += sale.totalAmount;
        }

        // ในส่วนนี้เราจะนับจำนวนสินค้า ไม่ว่าจะเป็นสินค้าปกติหรือรายการลดราคา
        // หากต้องการให้นับเฉพาะสินค้าหลัก ไม่รวมรายการเสริม/ลดราคา ควรเพิ่มเงื่อนไข
        // เช่น if (item.price > 0) { productQuantities[item.name] = ... }
        // แต่ในที่นี้ เรานับทุกรายการที่ถูกเพิ่มเข้ามา
        sale.items.forEach(item => {
            productQuantities[item.name] = (productQuantities[item.name] || 0) + item.quantity;
        });
    });

    monthlyTotalSales.textContent = totalSales.toFixed(2) + ' บาท';
    monthlyCashSales.textContent = cashSales.toFixed(2) + ' บาท';
    monthlyTransferSales.textContent = transferSales.toFixed(2) + ' บาท';

    drawProductSalesPieChart(productQuantities);
}

function drawProductSalesPieChart(productQuantities) {
    const ctx = productSalesChartCanvas.getContext('2d');

    // Destroy existing chart instance if it exists (สำคัญมาก!)
    if (productSalesChartInstance) {
        productSalesChartInstance.destroy();
    }

    const labels = Object.keys(productQuantities);
    const data = Object.values(productQuantities);
    const backgroundColors = generateRandomColors(labels.length);

    productSalesChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow canvas to resize freely within its container
            plugins: {
                legend: {
                    position: 'right', // Legend position (top, left, bottom, right)
                    labels: {
                        font: {
                            size: 14 // Font size of legend labels
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                // เรายังคงแสดงเป็น "X แก้ว" สำหรับทุกรายการ
                                // หากต้องการแยกประเภทการแสดงผล (เช่น "X ส่วนลด") ต้องเพิ่มเงื่อนไขตรงนี้
                                label += context.parsed + ' แก้ว';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Helper function to generate an array of distinct random colors
function generateRandomColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 137.508) % 360; // Use golden angle approximation for even distribution
        colors.push(`hsl(${hue}, 70%, 60%)`); // HSL for better control over vibrancy
    }
    return colors;
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
    // Remove active class from all sections and buttons
    posSection.classList.remove('active');
    historySection.classList.remove('active');
    monthlySection.classList.remove('active'); // New: Monthly Section
    
    posNavBtn.classList.remove('active');
    historyNavBtn.classList.remove('active');
    monthlyNavBtn.classList.remove('active'); // New: Monthly Nav Button

    // Add active class to the selected section and button
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
    } else if (pageName === 'monthly') { // New: Monthly Report Page
        monthlySection.classList.add('active');
        monthlyNavBtn.classList.add('active');
        renderMonthlyReport(); // สำคัญ: เรียก renderMonthlyReport() เมื่อแท็บนี้ถูกเปิดใช้งาน
    }
}

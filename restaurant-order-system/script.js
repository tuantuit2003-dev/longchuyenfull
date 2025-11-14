// ...existing code...
const MENU = {
  bia: [
    { name: "Bia Tiger", price: 18000 },
    { name: "Bia Heineken", price: 22000 },
    { name: "Bia Sài Gòn", price: 15000 },
    { name: "Đậu phộng rang", price: 10000 },
  ],
  lau: [
    { name: "Lẩu thái", price: 250000 },
    { name: "Lẩu riêu cua", price: 230000 },
    { name: "Lẩu hải sản", price: 300000 },
  ],
  co: [
    { name: "Gà hấp", price: 200000 },
    { name: "Bò xào", price: 150000 },
    { name: "Rau xào", price: 50000 },
    { name: "Đậu hũ chiên", price: 40000 },
  ]
};

const tableOrders = {};
for (let i = 1; i <= 30; i++) tableOrders[i] = [];

let currentTable = null;
let currentCategory = 'bia';

// render bàn
const grid = document.getElementById('grid');
for (let i = 1; i <= 30; i++) {
  const div = document.createElement('div');
  div.className = 'table-card';
  div.dataset.id = i;
  div.innerHTML = `
    <div class="table-name">Bàn ${i}</div>
    <div class="table-status" id="status-${i}">Trống</div>
  `;
  div.onclick = () => selectTable(i);
  grid.appendChild(div);
}

function selectTable(id) {
  currentTable = id;
  document.querySelectorAll('.table-card').forEach(el => el.classList.remove('active'));
  document.querySelector(`.table-card[data-id="${id}"]`).classList.add('active');
  document.getElementById('order-title').textContent = `Đang order bàn ${id}`;
  document.getElementById('order-note').textContent = `Chọn món để thêm vào bàn ${id}`;
  renderOrder();
}

function setCategory(cat) {
  currentCategory = cat;
  document.getElementById('tab-bia').classList.remove('active');
  document.getElementById('tab-lau').classList.remove('active');
  document.getElementById('tab-co').classList.remove('active');
  document.getElementById('tab-' + cat).classList.add('active');
  renderMenu();
}

function renderMenu() {
  const wrap = document.getElementById('menu-list');
  wrap.innerHTML = '';
  MENU[currentCategory].forEach(item => {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `<h4>${item.name}</h4><p>${item.price.toLocaleString()} đ</p>`;
    div.onclick = () => addToOrder(item);
    wrap.appendChild(div);
  });
}

function addToOrder(item) {
  if (!currentTable) { alert('Chọn bàn trước'); return; }
  const list = tableOrders[currentTable];
  const idx = list.findIndex(x => x.name === item.name);
  if (idx >= 0) {
    list[idx].qty += 1;
  } else {
    list.push({ name: item.name, price: item.price, qty: 1 });
  }
  document.getElementById(`status-${currentTable}`).textContent = 'Đang order';
  renderOrder();
}

// đổi: mỗi lần bấm sẽ trừ 1, còn 0 thì xóa
function deleteItemFromOrder(index) {
  if (!currentTable) return;
  const list = tableOrders[currentTable];
  if (!list[index]) return;

  list[index].qty -= 1;             // trừ 1 đơn vị
  if (list[index].qty <= 0) {
    list.splice(index, 1);          // hết thì xóa
  }

  if (list.length === 0) {
    document.getElementById(`status-${currentTable}`).textContent = 'Trống';
  }

  renderOrder();
}

function renderOrder() {
  const tbody = document.getElementById('order-body');
  const totalEl = document.getElementById('order-total');
  tbody.innerHTML = '';
  if (!currentTable) { totalEl.textContent = '0'; return; }

  const list = tableOrders[currentTable];
  let total = 0;
  list.forEach((item, idx) => {
    const line = item.qty * item.price;
    total += line;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${item.price.toLocaleString()}</td>
      <td>${line.toLocaleString()}</td>
      <td><button class="btn-del" onclick="deleteItemFromOrder(${idx})">-1</button></td>
    `;
    tbody.appendChild(tr);
  });
  totalEl.textContent = total.toLocaleString();
}

// DOM modal
const modalEl       = document.getElementById('invoice-modal');
const mTableEl      = document.getElementById('mTable');
const mBodyEl       = document.getElementById('mBody');
const mTotalEl      = document.getElementById('mTotal');
const btnPrint      = document.getElementById('btn-print');
const btnConfirm    = document.getElementById('btn-confirm');
const btnCloseModal = document.getElementById('modal-close');

function openInvoiceModal(bill){
  mTableEl.textContent = bill.table;
  mBodyEl.innerHTML = '';
  bill.items.forEach(item=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:6px">${item.name}</td>
      <td style="padding:6px;text-align:right">${item.qty}</td>
      <td style="padding:6px;text-align:right">${currency(item.price)}</td>
      <td style="padding:6px;text-align:right">${currency(item.total)}</td>
    `;
    mBodyEl.appendChild(tr);
  });
  mTotalEl.textContent = currency(bill.totalAmount);
  modalEl.classList.add('show');
}

function closeInvoiceModal(){
  modalEl.classList.remove('show');
}

btnPrint.addEventListener('click', ()=> window.print());
btnCloseModal.addEventListener('click', closeInvoiceModal);
modalEl.addEventListener('click', (e)=>{
  if(e.target === modalEl || e.target.classList.contains('modal__backdrop')){
    closeInvoiceModal();
  }
});

btnConfirm.addEventListener('click', ()=>{
  if (!currentTable) return;
  tableOrders[currentTable] = [];
  const st = document.getElementById(`status-${currentTable}`);
  if (st) st.textContent = 'Trống';
  closeInvoiceModal();
  renderOrder();
});

let lastBill = null;
const currency = n => Number(n||0).toLocaleString('vi-VN');

function saveBill(bill) {
  const rec = {
    id: 'HD' + Date.now(),
    time: new Date().toLocaleString('vi-VN'),
    table: bill.table,
    total: bill.totalAmount
  };
  const key = 'bills';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(rec);
  localStorage.setItem(key, JSON.stringify(arr));
}

function loadBills() {
  return JSON.parse(localStorage.getItem('bills') || '[]');
}

function payment() {
  if (!currentTable) {
    alert("Chọn bàn trước");
    return;
  }

  const orderList = tableOrders[currentTable];
  if (orderList.length === 0) {
    alert("Không có món nào trong đơn hàng.");
    return;
  }

  let total = 0;
  orderList.forEach(item => {
    total += item.qty * item.price;
  });

  let billContent = `
    <h2>Hóa đơn - Bàn ${currentTable}</h2>
    <table border="1">
      <thead>
        <tr>
          <th>Món</th>
          <th>SL</th>
          <th>Giá</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
  `;

  orderList.forEach(item => {
    const line = item.qty * item.price;
    billContent += `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${item.price.toLocaleString()}</td>
        <td>${line.toLocaleString()}</td>
      </tr>
    `;
  });

  billContent += `
    </tbody>
    </table>
    <h3>Tổng cộng: ${total.toLocaleString()} đ</h3>
  `;

  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.backgroundColor = 'white';
  modal.style.padding = '20px';
  modal.style.boxShadow = '0px 0px 15px rgba(0,0,0,0.2)';
  modal.style.zIndex = '1000';

  modal.innerHTML = `
    <div class="modal-header">
      <h2>Hóa đơn - Bàn ${currentTable}</h2>
    </div>
    <div class="modal-body">
      ${billContent}
    </div>
    <div class="modal-footer">
      <button id="btn-print" onclick="printBill()">In hóa đơn</button>
      <button id="btn-paid" onclick="markAsPaid()">Đã thanh toán</button>
    </div>
  `;

  document.body.appendChild(modal);
}

function printBill() {
  const billContent = document.querySelector('.modal-body').innerHTML;
  const currentDate = new Date();
  const formattedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
  const billWithDate = `
    <div style="text-align: 0;">
      <h1>Nhà Hàng Long Chuyên</h1>
      <h2>Hóa đơn - Bàn ${currentTable}</h2>
      <p><i>Ngày: ${formattedDate}</i></p>
      ${billContent}
    </div>
  `;
  const printWindow = window.open('', '', 'width=600,height=400');
  printWindow.document.write(billWithDate);
  printWindow.document.close();
  printWindow.print();
}

function markAsPaid() {
  const orderList = tableOrders[currentTable];
  const total = orderList.reduce((total, item) => total + item.qty * item.price, 0);

  const paymentData = {
    table: currentTable,
    items: orderList,
    total: total,
  };

  fetch('/save-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    tableOrders[currentTable] = [];
    document.getElementById(`status-${currentTable}`).textContent = 'Trống';
    renderOrder();
    const modal = document.getElementById('payment-modal');
    if (modal) {
      modal.remove();
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Có lỗi xảy ra khi lưu hóa đơn.');
  });
}
// ...existing code...
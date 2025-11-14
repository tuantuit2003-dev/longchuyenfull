const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Root -> serve index.html trực tiếp
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Hỗ trợ đường dẫn /order nếu còn gọi từ client
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Lưu hóa đơn
app.post('/save-invoice', (req, res) => {
  const bill = req.body;
  if (!bill || !bill.table || !bill.items || typeof bill.total === 'undefined') {
    return res.status(400).json({ message: 'Dữ liệu hóa đơn không hợp lệ' });
  }

  const invoiceFilePath = path.join(__dirname, 'invoices.json');

  fs.readFile(invoiceFilePath, 'utf8', (readErr, data) => {
    let invoices = [];
    if (readErr) {
      if (readErr.code !== 'ENOENT') {
        return res.status(500).json({ message: 'Lỗi khi đọc file hóa đơn' });
      }
      // ENOENT -> file chưa tồn tại, sẽ tạo mới
    } else {
      try {
        invoices = JSON.parse(data || '[]');
      } catch (e) {
        return res.status(500).json({ message: 'Dữ liệu hóa đơn bị hỏng' });
      }
    }

    invoices.push(bill);

    fs.writeFile(invoiceFilePath, JSON.stringify(invoices, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        return res.status(500).json({ message: 'Lỗi khi lưu hóa đơn' });
      }
      return res.status(200).json({ message: 'Hóa đơn đã được lưu' });
    });
  });
});

// Fallback
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
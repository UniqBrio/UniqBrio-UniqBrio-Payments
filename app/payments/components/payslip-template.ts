import { PaymentRecord } from "./payment-types";

interface PayslipTemplateOptions {
  paymentMethod?: string;
  accentColor?: string;
}

function currencySymbol(currency?: string) {
  const map: Record<string,string> = { INR: "₹", USD: "$", GBP: "£", EUR: "€" };
  return map[currency || 'INR'] || '₹';
}

export function buildPayslipHTML(record: PaymentRecord, opts: PayslipTemplateOptions = {}) {
  const { paymentMethod = 'N/A', accentColor = '#9234ea' } = opts;

  const courseFee = record.finalPayment || 0;
  const regStudent = record.registrationFees?.studentRegistration?.amount || 0;
  const regCourse = record.registrationFees?.courseRegistration?.amount || 0;
  const regConfirm = record.registrationFees?.confirmationFee?.amount || 0;
  const regTotal = regStudent + regCourse + regConfirm;
  const grandTotal = courseFee + regTotal;
  const paid = record.totalPaidAmount || 0;
  const balance = Math.max(0, grandTotal - paid);
  const percentPaid = grandTotal > 0 ? Math.min(100, Math.round((paid / grandTotal) * 100)) : 0;
  const sym = currencySymbol(record.currency);
  
  const nextDueRaw = record.nextPaymentDate;
  const nextDueDate = nextDueRaw ? new Date(nextDueRaw) : null;
  const daysToDue = nextDueDate ? Math.ceil((nextDueDate.getTime() - Date.now()) / (1000*60*60*24)) : null;
  const dueBadge = daysToDue != null ? (daysToDue < 0 ? 'Overdue' : daysToDue === 0 ? 'Due Today' : `${daysToDue} day${daysToDue === 1 ? '' : 's'}`) : '—';

  const script = `
    <script>
      (() => {
        const progress = document.getElementById('paidProgress');
        const theme = document.getElementById('themeToggle');
        const print = document.getElementById('printSlip');
        
        if (progress) {
          const target = parseInt(progress.dataset.target || '0');
          setTimeout(() => {
            progress.style.width = target + '%';
          }, 300);
        }
        
        if (theme) {
          theme.onclick = () => {
            document.body.classList.toggle('dark-theme');
          };
        }
        
        if (print) {
          print.onclick = () => window.print();
        }
      })();
    </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${record.name}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    .wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 32px;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .btn {
      background: ${accentColor};
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn.secondary { background: #6b7280; }
    header {
      text-align: center;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    header img {
      max-width: 180px;
      height: auto;
      margin-bottom: 12px;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    .course-line {
      color: #6b7280;
      font-size: 16px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .panel {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }
    .panel h3 {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #d1d5db;
    }
    .kv {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .kv:last-child { border-bottom: none; }
    .kv span:first-child {
      color: #6b7280;
      font-weight: 500;
    }
    .kv span:last-child {
      font-weight: 600;
      text-align: right;
    }
    .status-badge {
      background: ${record.paymentStatus === 'Paid' && balance === 0 ? '#dcfce7' : '#fef3c7'};
      color: ${record.paymentStatus === 'Paid' && balance === 0 ? '#166534' : '#92400e'};
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
    }
    .bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }
    .bar span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, ${accentColor}, #10b981);
      width: 0%;
      transition: width 1s ease;
    }
    .amounts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin: 32px 0;
    }
    .amount-card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .amount-card h4 {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .amt {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }
    .badge-paid { color: #059669; }
    .badge-bal { color: #dc2626; }
    .fees-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .fees-table th,
    .fees-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .fees-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
    }
    .footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    @media print {
      body { background: white; padding: 0; }
      .actions { display: none; }
      .wrapper { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="actions">
      <button id="themeToggle" class="btn secondary" type="button">Toggle Theme</button>
      <button id="printSlip" class="btn" type="button">Print</button>
    </div>
    <header>
      <div class="brand">
        <img src="/logo.png" alt="Logo" onerror="this.src='/uniqbrio-logo.svg'" />
        <h1 class="title">Payment Receipt</h1>
        <div class="course-line">Course: ${record.program || record.activity || 'N/A'}</div>
      </div>
    </header>
    <section class="meta-grid">
      <div class="panel">
        <h3>Student Information</h3>
        <div class="kv"><span>Name</span><span>${record.name}</span></div>
        <div class="kv"><span>Student ID</span><span>${record.id}</span></div>
        <div class="kv"><span>Course ID</span><span>${record.activity}</span></div>
        <div class="kv"><span>Course Name</span><span>${record.program || record.activity}</span></div>
        <div class="kv"><span>Category</span><span>${record.category}</span></div>
        ${record.cohort ? `<div class="kv"><span>Batch</span><span>${record.cohort}</span></div>` : ''}
        ${record.instructor ? `<div class="kv"><span>Instructor</span><span>${record.instructor}</span></div>` : ''}
        ${record.courseStartDate ? `<div class="kv"><span>Start Date</span><span>${new Date(record.courseStartDate).toLocaleDateString()}</span></div>` : ''}
      </div>
      <div class="panel">
        <h3>Payment Details</h3>
        <div class="kv"><span>Status</span><span class="status-badge">${record.paymentStatus}</span></div>
        <div class="kv"><span>Payment Method</span><span>${paymentMethod}</span></div>
        ${record.emiSplit ? `<div class="kv"><span>EMI Split</span><span>${record.emiSplit}</span></div>` : ''}
        <div class="kv"><span>Frequency</span><span>${record.paymentFrequency}</span></div>
        <div class="kv"><span>Next Due</span><span>${nextDueDate ? nextDueDate.toLocaleDateString() : '—'}</span></div>
        <div class="kv"><span>Due Status</span><span>${dueBadge}</span></div>
      </div>
      <div class="panel">
        <h3>Payment Progress</h3>
        <div class="kv"><span>Completed</span><span>${percentPaid}%</span></div>
        <div class="bar"><span id="paidProgress" data-target="${percentPaid}"></span></div>
        <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">
          ${sym}${paid.toLocaleString()} of ${sym}${grandTotal.toLocaleString()} paid
        </div>
        ${record.paymentDetails?.qrCode ? `
        <div style="text-align: center; margin-top: 16px;">
          <img src="${record.paymentDetails.qrCode}" alt="Payment QR Code" style="width: 120px; height: 120px;" />
          <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Scan QR Code for Payment</p>
        </div>` : ''}
      </div>
    </section>
    <section class="amounts">
      <div class="amount-card"><h4>Course Fee</h4><div class="amt">${sym}${courseFee.toLocaleString()}</div></div>
      <div class="amount-card"><h4>Registration Fees</h4><div class="amt">${sym}${regTotal.toLocaleString()}</div></div>
      <div class="amount-card"><h4>Grand Total</h4><div class="amt">${sym}${grandTotal.toLocaleString()}</div></div>
      <div class="amount-card"><h4>Amount Paid</h4><div class="amt badge-paid">${sym}${paid.toLocaleString()}</div></div>
      <div class="amount-card"><h4>Balance Due</h4><div class="amt badge-bal">${sym}${balance.toLocaleString()}</div></div>
    </section>
    <section style="margin-top: 32px;">
      <h3 style="font-size: 16px; margin: 0 0 16px; color: #374151; font-weight: 600;">Fee Breakdown</h3>
      <table class="fees-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Amount (${sym})</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Course Fee</td>
            <td>${courseFee.toLocaleString()}</td>
            <td>${courseFee ? 'Set' : 'Not Set'}</td>
          </tr>
          <tr>
            <td>Student Registration</td>
            <td>${regStudent.toLocaleString()}</td>
            <td>${record.registrationFees?.studentRegistration?.paid ? 'Paid' : 'Pending'}</td>
          </tr>
          <tr>
            <td>Course Registration</td>
            <td>${regCourse.toLocaleString()}</td>
            <td>${record.registrationFees?.courseRegistration?.paid ? 'Paid' : 'Pending'}</td>
          </tr>
          <tr>
            <td>Confirmation Fee</td>
            <td>${regConfirm.toLocaleString()}</td>
            <td>${record.registrationFees?.confirmationFee?.paid ? 'Paid' : 'Pending'}</td>
          </tr>
          <tr style="font-weight: 600; border-top: 2px solid #e5e7eb;">
            <td><strong>Total</strong></td>
            <td><strong>${grandTotal.toLocaleString()}</strong></td>
            <td><strong>${balance === 0 ? 'Fully Paid' : 'Outstanding'}</strong></td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="footer">
      <p>This receipt was generated on ${new Date().toLocaleString()}.</p>
      <p>No signature required. For queries: support@uniqbrio.com</p>
    </section>
  </div>
  ${script}
</body>
</html>`;
}

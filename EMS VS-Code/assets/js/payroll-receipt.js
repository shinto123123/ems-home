// Builds real, formatted payroll receipts and invoices from records and opens them
// in a new window for viewing/printing.

function money(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function receiptNumberFor(docId) {
    return `RCPT-${docId.slice(0, 8).toUpperCase()}`;
}

function invoiceNumberFor(docId) {
    return `INV-${docId.slice(0, 8).toUpperCase()}`;
}

function issuedDateFor(record) {
    if (record.createdOn) {
        const d = new Date(record.createdOn);
        if (!isNaN(d)) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function buildReceiptHtml(record, docId) {
    const netPay = record.netPay ?? ((Number(record.basicSalary) || 0) + (Number(record.allowances) || 0) - (Number(record.deductions) || 0));
    const status = record.status || 'Pending';
    const statusColor = status === 'Paid' ? '#16a34a' : '#d97706';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Payment Receipt ${receiptNumberFor(docId)}</title>
<style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',sans-serif; }
    body { background:#eef1f8; padding:40px; }
    .receipt { max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,.12); overflow:hidden; }
    .receipt-header { background:#111c44; color:#fff; padding:28px 32px; display:flex; justify-content:space-between; align-items:flex-start; }
    .receipt-header h1 { font-size:20px; letter-spacing:.4px; }
    .receipt-header p { font-size:12px; color:#a9b6e0; margin-top:4px; }
    .receipt-header .meta { text-align:right; font-size:12px; color:#a9b6e0; }
    .receipt-header .meta strong { display:block; color:#fff; font-size:14px; }
    .receipt-body { padding:32px; }
    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#8898aa; margin-bottom:10px; }
    .employee-block { display:flex; justify-content:space-between; margin-bottom:28px; padding-bottom:20px; border-bottom:1px dashed #d7dce6; }
    .employee-block div h3 { font-size:16px; color:#111c44; margin-bottom:2px; }
    .employee-block div p { font-size:13px; color:#5c667a; }
    .status-pill { display:inline-block; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:700; color:#fff; background:${statusColor}; height:fit-content; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    td { padding:10px 0; font-size:14px; color:#333d4d; }
    td.label { color:#8898aa; }
    td.value { text-align:right; font-weight:600; }
    tr.divider td { border-top:1px solid #e5e9f2; padding-top:16px; }
    tr.total td { font-size:17px; font-weight:800; color:#111c44; padding-top:16px; border-top:2px solid #111c44; }
    .footer-note { margin-top:16px; font-size:11.5px; color:#98a2b3; text-align:center; line-height:1.6; }
    .print-bar { max-width:640px; margin:0 auto 14px; text-align:right; }
    .print-bar button { background:#4299e1; color:#fff; border:none; padding:10px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
    .print-bar button:hover { background:#3182ce; }
    @media print { .print-bar { display:none; } body { background:#fff; padding:0; } .receipt { box-shadow:none; border-radius:0; } }
</style>
</head>
<body>
    <div class="print-bar"><button onclick="window.print()">Print / Save as PDF</button></div>
    <div class="receipt">
        <div class="receipt-header">
            <div>
                <h1>EMS Enterprise Portal</h1>
                <p>Official Payment Receipt</p>
            </div>
            <div class="meta">
                <strong>${receiptNumberFor(docId)}</strong>
                Issued ${issuedDateFor(record)}
            </div>
        </div>
        <div class="receipt-body">
            <div class="employee-block">
                <div>
                    <h3>${record.employeeName || 'Staff Member'}</h3>
                    <p>${record.designation || ''}${record.designation && record.department ? ' &middot; ' : ''}${record.department || ''}</p>
                </div>
                <span class="status-pill">${status}</span>
            </div>

            <div class="section-title">Breakdown</div>
            <table>
                <tr><td class="label">Basic Amount</td><td class="value">$${money(record.basicSalary)}</td></tr>
                <tr><td class="label">Allowances / Additions</td><td class="value">+ $${money(record.allowances)}</td></tr>
                <tr class="divider"><td class="label">Deductions / Withholdings</td><td class="value">- $${money(record.deductions)}</td></tr>
                <tr class="total"><td>Total Amount</td><td class="value">$${money(netPay)}</td></tr>
            </table>

            <p class="footer-note">This receipt was generated automatically by the Employee Management System.<br>No signature is required for validity.</p>
        </div>
    </div>
</body>
</html>`;
}

export function buildInvoiceHtml(record, docId) {
    const basic = Number(record.basicSalary) || 0;
    const allowances = Number(record.allowances) || 0;
    const deductions = Number(record.deductions) || 0;
    const receivingAmount = record.netPay ?? (basic + allowances - deductions);
    const isPaid = (record.status || '').toLowerCase() === 'paid';
    const paidAmount = isPaid ? receivingAmount : 0;
    const balanceDue = isPaid ? 0 : receivingAmount;
    const statusColor = isPaid ? '#16a34a' : '#d97706';
    const statusText = isPaid ? 'PAID' : 'PENDING';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Official Invoice ${invoiceNumberFor(docId)}</title>
<style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',sans-serif; }
    body { background:#eef1f8; padding:40px; }
    .invoice { max-width:720px; margin:0 auto; background:#ffffff; border-radius:16px; box-shadow:0 12px 45px rgba(0,0,0,.12); overflow:hidden; }
    .invoice-header { background:linear-gradient(135deg, #111c44 0%, #1b2e6e 100%); color:#fff; padding:32px 36px; display:flex; justify-content:space-between; align-items:flex-start; }
    .invoice-header h1 { font-size:22px; font-weight:700; letter-spacing:.5px; }
    .invoice-header p { font-size:12.5px; color:#a9b6e0; margin-top:4px; }
    .invoice-header .meta { text-align:right; font-size:12.5px; color:#a9b6e0; }
    .invoice-header .meta strong { display:block; color:#fff; font-size:15px; margin-bottom:3px; }
    .invoice-body { padding:36px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px; padding-bottom:24px; border-bottom:1px solid #e5e9f2; }
    .info-box h4 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#8898aa; margin-bottom:6px; }
    .info-box p { font-size:13.5px; color:#111c44; font-weight:600; line-height:1.5; }
    .info-box small { font-size:12px; color:#5c667a; font-weight:400; }
    .status-badge { display:inline-block; padding:5px 14px; border-radius:20px; font-size:11.5px; font-weight:700; color:#fff; background:${statusColor}; }
    table.inv-table { width:100%; border-collapse:collapse; margin-bottom:28px; }
    table.inv-table th { background:#f8fafc; padding:12px 14px; font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; text-align:left; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; }
    table.inv-table td { padding:14px; font-size:13.5px; color:#1e293b; border-bottom:1px solid #f1f5f9; }
    table.inv-table td.amount { text-align:right; font-weight:600; }
    .totals-area { display:flex; justify-content:flex-end; margin-bottom:32px; }
    .totals-table { width:280px; }
    .totals-table tr td { padding:7px 0; font-size:13px; color:#475569; }
    .totals-table tr td.val { text-align:right; font-weight:600; color:#1e293b; }
    .totals-table tr.grand-total td { font-size:16px; font-weight:800; color:#111c44; border-top:2px solid #111c44; padding-top:12px; }
    .totals-table tr.highlight td { color:${statusColor}; font-weight:700; }
    .invoice-footer { background:#f8fafc; padding:20px 36px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:#64748b; }
    .print-bar { max-width:720px; margin:0 auto 14px; text-align:right; }
    .print-bar button { background:#4299e1; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
    .print-bar button:hover { background:#3182ce; }
    @media print { .print-bar { display:none; } body { background:#fff; padding:0; } .invoice { box-shadow:none; border-radius:0; } }
</style>
</head>
<body>
    <div class="print-bar"><button onclick="window.print()">Print / Save Invoice as PDF</button></div>
    <div class="invoice">
        <div class="invoice-header">
            <div>
                <h1>EMS Organization</h1>
                <p>Official Commercial & Accounts Invoice</p>
            </div>
            <div class="meta">
                <strong>${invoiceNumberFor(docId)}</strong>
                <span>Date: ${issuedDateFor(record)}</span>
            </div>
        </div>
        <div class="invoice-body">
            <div class="info-grid">
                <div class="info-box">
                    <h4>Billed To / Payee:</h4>
                    <p>${record.employeeName || 'Recipient'}</p>
                    <small>${record.designation || 'Staff'} &bull; ${record.department || 'Corporate'}</small>
                </div>
                <div class="info-box" style="text-align:right;">
                    <h4>Payment Status:</h4>
                    <span class="status-badge">${statusText}</span>
                    <div style="margin-top:8px;"><small>Doc Reference: #${docId.slice(0, 10)}</small></div>
                </div>
            </div>

            <table class="inv-table">
                <thead>
                    <tr>
                        <th>Description / Line Item</th>
                        <th>Category</th>
                        <th style="text-align:right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Primary Base Compensation / Service</strong><br><small style="color:#64748b;">Standard contractual remuneration</small></td>
                        <td>Base Rate</td>
                        <td class="amount">$${money(basic)}</td>
                    </tr>
                    <tr>
                        <td><strong>Approved Allowances & Stipends</strong><br><small style="color:#64748b;">Project incentives, travel, and operational allowances</small></td>
                        <td>Additions</td>
                        <td class="amount">+ $${money(allowances)}</td>
                    </tr>
                    <tr>
                        <td><strong>Statutory Deductions & Withholdings</strong><br><small style="color:#64748b;">Taxes, benefits, and standard deductions</small></td>
                        <td>Deductions</td>
                        <td class="amount" style="color:#dc2626;">- $${money(deductions)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="totals-area">
                <table class="totals-table">
                    <tr><td>Gross Invoiced:</td><td class="val">$${money(basic + allowances)}</td></tr>
                    <tr><td>Total Deductions:</td><td class="val" style="color:#dc2626;">-$${money(deductions)}</td></tr>
                    <tr class="grand-total"><td>Receiving Amount:</td><td class="val">$${money(receivingAmount)}</td></tr>
                    <tr><td>Amount Paid:</td><td class="val" style="color:#16a34a;">$${money(paidAmount)}</td></tr>
                    <tr class="highlight"><td>Balance Pending:</td><td class="val">$${money(balanceDue)}</td></tr>
                </table>
            </div>
        </div>
        <div class="invoice-footer">
            <span>Generated electronically by EMS Accounting Module</span>
            <span>Terms: Immediate Settlement upon authorization</span>
        </div>
    </div>
</body>
</html>`;
}

export function openReceiptWindow(record, docId) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildReceiptHtml(record, docId));
    win.document.close();
}

export function openInvoiceWindow(record, docId) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildInvoiceHtml(record, docId));
    win.document.close();
}

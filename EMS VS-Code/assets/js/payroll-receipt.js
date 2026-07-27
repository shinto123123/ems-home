// Builds a real, formatted payroll receipt from a payroll record and opens it
// in a new window for viewing/printing. Every payroll record gets a receipt
// automatically -- there is nothing to upload.

function money(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function receiptNumberFor(docId) {
    return `RCPT-${docId.slice(0, 8).toUpperCase()}`;
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
<title>Payroll Receipt ${receiptNumberFor(docId)}</title>
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
                <h1>Paoyaila Animation Studio</h1>
                <p>Official Salary Payment Receipt</p>
            </div>
            <div class="meta">
                <strong>${receiptNumberFor(docId)}</strong>
                Issued ${issuedDateFor(record)}
            </div>
        </div>
        <div class="receipt-body">
            <div class="employee-block">
                <div>
                    <h3>${record.employeeName || 'Employee'}</h3>
                    <p>${record.designation || ''}${record.designation && record.department ? ' &middot; ' : ''}${record.department || ''}</p>
                </div>
                <span class="status-pill">${status}</span>
            </div>

            <div class="section-title">Salary Breakdown</div>
            <table>
                <tr><td class="label">Basic Salary</td><td class="value">$${money(record.basicSalary)}</td></tr>
                <tr><td class="label">Allowances</td><td class="value">+ $${money(record.allowances)}</td></tr>
                <tr class="divider"><td class="label">Deductions</td><td class="value">- $${money(record.deductions)}</td></tr>
                <tr class="total"><td>Net Pay</td><td class="value">$${money(netPay)}</td></tr>
            </table>

            <p class="footer-note">This receipt was generated automatically by the Employee Management System at the time of payroll entry.<br>No signature is required for validity.</p>
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

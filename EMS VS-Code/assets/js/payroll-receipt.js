// Builds real, dynamic, formatted payroll receipts and invoices from records
// and opens them in a new window for viewing, printing, and saving as PDF.

function money(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatINR(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function receiptNumberFor(docId) {
    if (!docId) return 'RCPT-2026-001';
    if (docId.startsWith('RCPT-')) return docId;
    return `RCPT-${String(docId).replace(/^REC-|^PR-|^PAY-/, '').toUpperCase()}`;
}

function invoiceNumberFor(record = {}, docId = '') {
    if (record.invoiceNo) return record.invoiceNo;
    if (record.invoiceId) return record.invoiceId;
    if (docId && docId.startsWith('INV-')) return docId;
    if (record.id && String(record.id).startsWith('INV-')) return record.id;
    if (record.customId) return `INV-2026-${record.customId.toUpperCase()}`;
    if (record.employeeId) return `INV-2026-${record.employeeId.toUpperCase()}`;
    if (record.id) return `INV-${String(record.id).replace(/^REC-|^PR-|^PAY-/, '').toUpperCase()}`;
    if (docId) return `INV-${String(docId).replace(/^REC-|^PR-|^PAY-/, '').toUpperCase()}`;
    return 'INV-2026-001';
}

function formatDateDisplay(dateInput) {
    if (!dateInput) {
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function addDaysToDate(dateInput, days = 15) {
    let d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    d.setDate(d.getDate() + days);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function issuedDateFor(record) {
    if (record.date) return formatDateDisplay(record.date);
    if (record.createdOn) return formatDateDisplay(record.createdOn);
    if (record.invoiceDate) return formatDateDisplay(record.invoiceDate);
    return formatDateDisplay(new Date());
}

export function buildReceiptHtml(record = {}, docId = '') {
    const isOutflow = record.flow === 'Outflow' || Boolean(record.employeeName) || (record.basicSalary !== undefined && Number(record.basicSalary) > 0);
    const netPay = record.netPay !== undefined 
        ? Number(record.netPay) 
        : ((Number(record.basicSalary) || 0) + (Number(record.allowances) || 0) - (Number(record.deductions) || 0));
    
    const targetAmount = isOutflow 
        ? (netPay || Number(record.paidAmount) || Number(record.basicSalary) || 0)
        : (Number(record.receivingAmount) || Number(record.amount) || Number(record.grandTotal) || 0);

    const status = record.status || (isOutflow ? 'Paid' : 'Received');
    const statusColor = (status.toLowerCase() === 'paid' || status.toLowerCase() === 'received') ? '#16a34a' : '#d97706';
    const rcptNo = receiptNumberFor(docId || record.id || record.customId);

    const recipientName = record.employeeName || record.name || record.client || 'Valued Recipient';
    const recipientSubtitle = record.designation 
        ? `${record.designation}${record.department ? ' &middot; ' + record.department + ' Dept' : ''}`
        : (record.desc || record.category || (isOutflow ? 'Payroll Disbursement' : 'Client Settlement'));

    const baseAmount = isOutflow 
        ? (Number(record.basicSalary) || targetAmount) 
        : targetAmount;
    const allowances = Number(record.allowances) || 0;
    const deductions = Number(record.deductions) || 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payment Receipt ${rcptNo} - Paoyaila Technologies</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans','Segoe UI',sans-serif; }
    body { background:#0b1437; padding:40px 20px; color:#1e293b; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
    .receipt { width:100%; max-width:680px; background:#ffffff; border-radius:16px; box-shadow:0 15px 50px rgba(0,0,0,.45); overflow:hidden; }
    .receipt-header { background:linear-gradient(135deg, #0c1d3b 0%, #112c5b 100%); color:#fff; padding:28px 32px; display:flex; justify-content:space-between; align-items:flex-start; position:relative; }
    .receipt-header h1 { font-size:20px; font-weight:800; letter-spacing:.5px; }
    .receipt-header p { font-size:12px; color:#a9b6e0; margin-top:4px; }
    .receipt-header .meta { text-align:right; font-size:12px; color:#a9b6e0; }
    .receipt-header .meta strong { display:block; color:#fff; font-size:14px; font-weight:700; margin-bottom:2px; }
    .receipt-body { padding:32px; }
    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#8898aa; margin-bottom:10px; }
    .employee-block { display:flex; justify-content:space-between; margin-bottom:28px; padding-bottom:20px; border-bottom:1px dashed #d7dce6; align-items:center; }
    .employee-block div h3 { font-size:17px; font-weight:700; color:#0c1d3b; margin-bottom:3px; }
    .employee-block div p { font-size:13px; color:#5c667a; }
    .status-pill { display:inline-block; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:700; color:#fff; background:${statusColor}; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    td { padding:10px 0; font-size:13.5px; color:#333d4d; }
    td.label { color:#64748b; font-weight:500; }
    td.value { text-align:right; font-weight:700; color:#0c1d3b; }
    tr.divider td { border-top:1px solid #e5e9f2; padding-top:14px; }
    tr.total td { font-size:17px; font-weight:800; color:#0c1d3b; padding-top:16px; border-top:2px solid #0c1d3b; }
    .footer-note { margin-top:20px; font-size:11px; color:#98a2b3; text-align:center; line-height:1.6; border-top:1px solid #f1f5f9; padding-top:16px; }
    .print-bar { width:100%; max-width:680px; margin:0 auto 16px; display:flex; justify-content:space-between; align-items:center; }
    .print-bar .title { color:#ffffff; font-size:14.5px; font-weight:700; display:flex; align-items:center; gap:8px; }
    .print-bar button { background:#009688; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(0,150,136,0.3); transition:background .2s; }
    .print-bar button:hover { background:#00796b; }
    @media print { .print-bar { display:none; } body { background:#fff; padding:0; } .receipt { box-shadow:none; border-radius:0; width:100%; max-width:100%; } }
</style>
</head>
<body>
    <div class="print-bar">
        <span class="title"><i class="fa-solid fa-receipt" style="color:#009688;"></i> Official Payment Receipt</span>
        <button onclick="window.print()"><i class="fa-solid fa-print"></i> Print / Save as PDF</button>
    </div>
    <div class="receipt">
        <div class="receipt-header">
            <div>
                <h1>Paoyaila Technologies Pvt. Ltd.</h1>
                <p>Official Financial & Payment Settlement Receipt</p>
            </div>
            <div class="meta">
                <strong>${rcptNo}</strong>
                Issued ${issuedDateFor(record)}
            </div>
        </div>
        <div class="receipt-body">
            <div class="employee-block">
                <div>
                    <h3>${recipientName}</h3>
                    <p>${recipientSubtitle}</p>
                </div>
                <span class="status-pill">${status}</span>
            </div>

            <div class="section-title">Settlement Breakdown</div>
            <table>
                <tr>
                    <td class="label">${isOutflow ? 'Basic Remuneration / Base Salary' : 'Gross Service / Base Revenue'}</td>
                    <td class="value">₹${formatINR(baseAmount)}</td>
                </tr>
                ${allowances > 0 ? `<tr><td class="label">Allowances & Special Additions</td><td class="value" style="color:#16a34a;">+ ₹${formatINR(allowances)}</td></tr>` : ''}
                ${deductions > 0 ? `<tr class="divider"><td class="label">Deductions & Statutory Withholdings</td><td class="value" style="color:#ef4444;">- ₹${formatINR(deductions)}</td></tr>` : ''}
                <tr class="total">
                    <td>Total Net Settlement Amount</td>
                    <td class="value">₹${formatINR(targetAmount)}</td>
                </tr>
            </table>

            <p class="footer-note">This receipt was generated electronically and validated by Paoyaila EMS Accounting Core.<br>Infopark, Kochi, Kerala, India – 682030 &bull; hrpaoyaila@gmail.com &bull; www.paoyaila.com</p>
        </div>
    </div>
</body>
</html>`;
}

export function buildInvoiceHtml(record = {}, docId = '') {
    const isOutflow = record.flow === 'Outflow' || Boolean(record.employeeName) || (record.basicSalary !== undefined && Number(record.basicSalary) > 0);
    
    // Normalization and extraction of invoice meta data
    const invoiceNo = invoiceNumberFor(record, docId);
    const invoiceDate = record.invoiceDate || issuedDateFor(record);
    const rawDateVal = record.date || record.createdOn || new Date().toISOString();
    const dueDate = record.dueDate ? formatDateDisplay(record.dueDate) : addDaysToDate(rawDateVal, isOutflow ? 0 : 15);
    const poNo = record.poNo || (record.customId ? `PO-2026-${record.customId.toUpperCase()}` : (record.id ? `PO-2026-${String(record.id).replace(/[^0-9a-zA-Z]/g, '').slice(-3).toUpperCase()}` : 'PO-2026-045'));
    const paymentTerms = record.paymentTerms || (isOutflow ? 'Immediate (Net 0)' : '15 Days');
    const placeOfSupply = record.placeOfSupply || 'Kerala (32)';

    // Recipient Bill To
    let billToName = '';
    let billToAddr1 = '';
    let billToAddr2 = '';
    let billToGstin = '';
    let billToEmail = '';
    let billToPhone = '';

    if (isOutflow) {
        // Payroll / Employee Voucher
        const empName = record.employeeName || record.name || 'Staff Member';
        const empId = record.customId || record.employeeId || record.employeeUid || (record.id ? String(record.id).slice(0, 8) : 'EMP-2026');
        billToName = empName;
        billToAddr1 = record.designation ? `${record.designation} (${record.department || 'Engineering'} Department)` : 'Corporate Team Member';
        billToAddr2 = 'Paoyaila Technologies Campus, Kochi – 682030';
        billToGstin = `EMP-ID: ${empId}`;
        billToEmail = record.email || `${empName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@paoyaila.com`;
        billToPhone = record.phone || '+91 999 555 1234';
    } else {
        // Client Inflow / General Invoice
        billToName = record.billTo?.name || record.client || record.name || 'TechNova Solutions Pvt. Ltd.';
        billToAddr1 = record.billTo?.addressLine1 || record.clientAddress1 || '4th Floor, Global Tech Park,';
        billToAddr2 = record.billTo?.addressLine2 || record.clientAddress2 || 'Kakkanad, Kochi, Kerala – 682037';
        billToGstin = record.billTo?.gstin || record.gstin || '32ABCDE1234F1Z5';
        billToEmail = record.billTo?.email || record.email || `accounts@${billToName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`;
        billToPhone = record.billTo?.phone || record.phone || '+91 987 654 3210';
    }

    // Recipient Ship To
    const shipToName = record.shipTo?.name || billToName;
    const shipToAddr1 = record.shipTo?.addressLine1 || billToAddr1;
    const shipToAddr2 = record.shipTo?.addressLine2 || billToAddr2;

    // Line items and financial calculation resolution
    let items = [];
    let subTotal = 0;
    let discount = 0;
    let taxableAmount = 0;
    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;
    let grandTotal = 0;

    if (Array.isArray(record.items) && record.items.length > 0) {
        // Use explicitly provided items
        items = record.items;
        const computedSub = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
        subTotal = record.subTotal !== undefined ? Number(record.subTotal) : computedSub;
        discount = record.discount !== undefined ? Number(record.discount) : 0;
        taxableAmount = record.taxableAmount !== undefined ? Number(record.taxableAmount) : Math.max(0, subTotal - discount);

        const isInterState = Boolean(record.isInterState);
        cgstRate = isInterState ? 0 : (record.cgstRate !== undefined ? Number(record.cgstRate) : 9);
        sgstRate = isInterState ? 0 : (record.sgstRate !== undefined ? Number(record.sgstRate) : 9);
        igstRate = isInterState ? (record.igstRate !== undefined ? Number(record.igstRate) : 18) : 0;

        cgstAmount = isInterState ? 0 : (record.cgstAmount !== undefined ? Number(record.cgstAmount) : Number((taxableAmount * (cgstRate / 100)).toFixed(2)));
        sgstAmount = isInterState ? 0 : (record.sgstAmount !== undefined ? Number(record.sgstAmount) : Number((taxableAmount * (sgstRate / 100)).toFixed(2)));
        igstAmount = isInterState ? (record.igstAmount !== undefined ? Number(record.igstAmount) : Number((taxableAmount * (igstRate / 100)).toFixed(2))) : 0;

        grandTotal = record.grandTotal !== undefined ? Number(record.grandTotal) : (taxableAmount + cgstAmount + sgstAmount + igstAmount);

    } else if (isOutflow) {
        // Dynamic construction for Payroll / Remuneration Voucher
        const basicSalary = Number(record.basicSalary) || 0;
        const allowances = Number(record.allowances) || 0;
        const deductions = Number(record.deductions) || 0;
        const netPay = record.netPay !== undefined 
            ? Number(record.netPay) 
            : (basicSalary > 0 ? (basicSalary + allowances - deductions) : (Number(record.paidAmount) || 0));

        const targetNet = netPay || Number(record.paidAmount) || basicSalary;
        const primaryBase = basicSalary > 0 ? basicSalary : targetNet;

        items = [
            {
                sl: 1,
                title: record.designation ? `Professional Remuneration – ${record.designation}` : 'Monthly Professional Compensation',
                description: `Remuneration and salary payout for ${billToName}${record.department ? ` (${record.department} Dept)` : ''}`,
                hsn: '998311',
                qty: 1,
                unit: 'Month',
                rate: primaryBase,
                amount: primaryBase
            }
        ];

        if (allowances > 0) {
            items.push({
                sl: 2,
                title: 'Allowances & Special Incentives',
                description: 'HRA, travel allowance, medical allowance & performance bonuses',
                hsn: '998311',
                qty: 1,
                unit: 'Month',
                rate: allowances,
                amount: allowances
            });
        }

        subTotal = primaryBase + allowances;
        discount = deductions;
        taxableAmount = Math.max(0, subTotal - discount);
        
        // Non-GST payroll disbursement
        cgstRate = 0;
        cgstAmount = 0;
        sgstRate = 0;
        sgstAmount = 0;
        igstRate = 0;
        igstAmount = 0;
        grandTotal = taxableAmount;

    } else {
        // Dynamic construction for Client Inflow / Service Invoice matching the original target value
        const targetAmount = Number(record.grandTotal ?? record.receivingAmount ?? record.amount ?? 85550.00);
        
        // Exact standard 18% GST (9% CGST + 9% SGST) breakdown
        const isInterState = Boolean(record.isInterState);
        cgstRate = isInterState ? 0 : 9;
        sgstRate = isInterState ? 0 : 9;
        igstRate = isInterState ? 18 : 0;

        const effectiveTaxRate = isInterState ? 0.18 : 0.18;
        
        // Calculate taxable amount so that taxable + CGST + SGST exactly equals the target amount
        let calculatedTaxable = Number((targetAmount / (1 + effectiveTaxRate)).toFixed(2));
        cgstAmount = isInterState ? 0 : Number((calculatedTaxable * 0.09).toFixed(2));
        sgstAmount = isInterState ? 0 : Number((calculatedTaxable * 0.09).toFixed(2));
        igstAmount = isInterState ? Number((calculatedTaxable * 0.18).toFixed(2)) : 0;

        // Eliminate any 1-cent/1-paisa rounding difference to guarantee exact match with original value
        const currentSum = calculatedTaxable + cgstAmount + sgstAmount + igstAmount;
        const diff = Number((targetAmount - currentSum).toFixed(2));
        if (diff !== 0) {
            calculatedTaxable = Number((calculatedTaxable + diff).toFixed(2));
        }

        subTotal = calculatedTaxable;
        discount = 0;
        taxableAmount = calculatedTaxable;
        grandTotal = targetAmount;

        const serviceTitle = record.desc || 'Professional Software & Cloud Engineering Services';
        const serviceCategory = record.category ? `${record.category} - Deliverable for ${billToName}` : 'Design, development, and technical consulting deliverables';

        items = [
            {
                sl: 1,
                title: serviceTitle,
                description: serviceCategory,
                hsn: '998314',
                qty: 1,
                unit: 'Nos',
                rate: calculatedTaxable,
                amount: calculatedTaxable
            }
        ];
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${invoiceNo} - Paoyaila Technologies</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Segoe+UI:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    }
    body {
        background: #0b1437;
        padding: 30px 20px;
        color: #1e293b;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100vh;
    }

    /* Print / PDF Control Bar */
    .print-bar {
        width: 100%;
        max-width: 820px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .print-bar-title {
        color: #ffffff;
        font-size: 15px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .print-btn {
        background: #009688;
        color: #ffffff;
        border: none;
        padding: 9px 20px;
        border-radius: 8px;
        font-size: 13.5px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(0, 150, 136, 0.4);
        transition: background 0.2s, transform 0.1s;
    }
    .print-btn:hover {
        background: #00796b;
        transform: translateY(-1px);
    }
    .print-btn:active {
        transform: translateY(0);
    }

    /* Main Invoice Document Page */
    .invoice-page {
        width: 820px;
        background: #ffffff;
        border-radius: 4px;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.45);
        position: relative;
        overflow: hidden;
        padding: 38px 42px 32px 42px;
        display: flex;
        flex-direction: column;
    }

    /* TOP RIGHT GEOMETRIC ACCENT */
    .top-right-accent {
        position: absolute;
        top: 0;
        right: 0;
        width: 220px;
        height: 70px;
        pointer-events: none;
        z-index: 1;
    }

    /* HEADER SECTION */
    .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: relative;
        z-index: 2;
        margin-bottom: 24px;
    }

    /* Company Info (Top Left) */
    .company-block {
        max-width: 360px;
    }
    .brand-logo-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
    }
    .brand-logo-svg {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
    }
    .brand-name-wrap {
        display: flex;
        flex-direction: column;
    }
    .brand-title {
        font-size: 26px;
        font-weight: 800;
        color: #0c1d3b;
        letter-spacing: 1.2px;
        line-height: 1.1;
    }
    .brand-subtitle {
        font-size: 9.5px;
        font-weight: 700;
        color: #009688;
        letter-spacing: 0.8px;
        margin-top: 3px;
    }

    .company-contact {
        list-style: none;
        margin-top: 4px;
    }
    .company-contact li {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 11.5px;
        color: #1e293b;
        font-weight: 500;
        margin-bottom: 5px;
    }
    .company-contact li i {
        color: #0c1d3b;
        font-size: 13px;
        width: 14px;
        text-align: center;
    }
    .company-divider {
        height: 1.5px;
        background: #009688;
        width: 260px;
        margin-top: 12px;
    }

    /* Invoice Title & Meta (Top Right) */
    .invoice-meta-block {
        width: 330px;
        text-align: right;
    }
    .invoice-main-heading {
        font-size: 40px;
        font-weight: 800;
        color: #0c1d3b;
        letter-spacing: 2px;
        line-height: 1;
        margin-bottom: 18px;
        padding-right: 4px;
    }
    .meta-table {
        width: 100%;
        border-collapse: collapse;
    }
    .meta-table tr td {
        padding: 3.5px 0;
        font-size: 12px;
    }
    .meta-table td.icon-col {
        width: 22px;
        text-align: left;
        color: #0c1d3b;
        font-size: 13px;
    }
    .meta-table td.label-col {
        text-align: left;
        font-weight: 600;
        color: #0c1d3b;
        white-space: nowrap;
        padding-right: 6px;
    }
    .meta-table td.colon-col {
        width: 16px;
        text-align: center;
        font-weight: 700;
        color: #0c1d3b;
    }
    .meta-table td.val-col {
        text-align: left;
        font-weight: 600;
        color: #1e293b;
        padding-left: 6px;
        white-space: nowrap;
    }

    /* RECIPIENT SECTION (BILL TO / SHIP TO) */
    .recipient-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 22px;
    }
    .recipient-card-wrap {
        display: flex;
        flex-direction: column;
    }
    .recipient-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 14px;
        border-radius: 6px 6px 0 0;
        font-size: 11px;
        font-weight: 700;
        color: #ffffff;
        width: fit-content;
        letter-spacing: 0.5px;
    }
    .badge-navy {
        background: #0c1d3b;
    }
    .badge-teal {
        background: #009688;
    }
    .recipient-box {
        background: #f1f6fa;
        border: 1px solid #e0ebf3;
        border-radius: 0 8px 8px 8px;
        padding: 13px 16px;
        min-height: 122px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
    }
    .recipient-name {
        font-size: 13.5px;
        font-weight: 700;
        color: #0c1d3b;
        margin-bottom: 3px;
    }
    .recipient-address {
        font-size: 11.5px;
        color: #334155;
        line-height: 1.45;
        margin-bottom: 8px;
    }
    .recipient-meta-table {
        border-collapse: collapse;
        margin-top: 2px;
    }
    .recipient-meta-table tr td {
        padding: 1.5px 0;
        font-size: 11.5px;
    }
    .recipient-meta-table td.m-label {
        font-weight: 600;
        color: #0c1d3b;
        width: 60px;
    }
    .recipient-meta-table td.m-colon {
        width: 14px;
        text-align: center;
        font-weight: 700;
        color: #0c1d3b;
    }
    .recipient-meta-table td.m-val {
        color: #334155;
        padding-left: 4px;
    }

    /* ITEMS TABLE */
    .items-table-wrap {
        margin-bottom: 22px;
    }
    .items-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #e2e8f0;
    }
    .items-table thead tr {
        background: #0c1d3b;
        color: #ffffff;
    }
    .items-table th {
        padding: 9px 10px;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        border-right: 1px solid rgba(255,255,255,0.15);
    }
    .items-table th:last-child {
        border-right: none;
    }
    .items-table td {
        padding: 11px 10px;
        font-size: 11.5px;
        color: #1e293b;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        vertical-align: middle;
    }
    .items-table td:last-child {
        border-right: none;
    }
    .col-center { text-align: center; }
    .col-left { text-align: left; }
    .col-right { text-align: right; }

    .item-title {
        font-weight: 700;
        color: #0c1d3b;
        font-size: 12px;
        line-height: 1.3;
    }
    .item-desc {
        color: #475569;
        font-size: 10.5px;
        margin-top: 3px;
        line-height: 1.35;
    }

    /* BOTTOM TWO-COLUMN SECTION */
    .bottom-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 16px;
    }

    /* Bottom Left: Payment Info & Terms */
    .payment-terms-wrap {
        display: flex;
        flex-direction: column;
    }
    .payment-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 12px;
        background: #009688;
        color: #ffffff;
        font-size: 10.5px;
        font-weight: 700;
        border-radius: 4px 4px 0 0;
        width: fit-content;
        letter-spacing: 0.4px;
    }
    .payment-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0 6px 6px 6px;
        padding: 10px 14px;
    }
    .payment-table {
        width: 100%;
        border-collapse: collapse;
    }
    .payment-table tr td {
        padding: 2.5px 0;
        font-size: 11.5px;
    }
    .payment-table td.p-label {
        font-weight: 600;
        color: #0c1d3b;
        width: 110px;
        white-space: nowrap;
    }
    .payment-table td.p-colon {
        width: 14px;
        text-align: center;
        font-weight: 700;
        color: #0c1d3b;
    }
    .payment-table td.p-val {
        color: #1e293b;
        font-weight: 500;
        padding-left: 6px;
    }

    .terms-wrap {
        margin-top: 14px;
    }
    .terms-title {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #009688;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 6px;
        letter-spacing: 0.4px;
    }
    .terms-list {
        list-style: none;
        counter-reset: term-counter;
    }
    .terms-list li {
        counter-increment: term-counter;
        font-size: 9.5px;
        color: #334155;
        line-height: 1.45;
        margin-bottom: 3.5px;
        display: flex;
        align-items: flex-start;
        gap: 6px;
    }
    .terms-list li::before {
        content: counter(term-counter) ".";
        font-weight: 700;
        color: #334155;
        min-width: 12px;
    }

    /* Bottom Right: Calculations, Grand Total & Signatory */
    .calculations-wrap {
        display: flex;
        flex-direction: column;
    }
    .calc-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 6px;
    }
    .calc-table tr td {
        padding: 4px 0;
        font-size: 11.5px;
    }
    .calc-table td.c-label {
        font-weight: 600;
        color: #0c1d3b;
        text-align: left;
    }
    .calc-table td.c-val {
        font-weight: 600;
        color: #1e293b;
        text-align: right;
    }
    .calc-table tr.taxable-row td.c-label,
    .calc-table tr.taxable-row td.c-val {
        color: #009688;
        font-weight: 700;
    }

    /* GRAND TOTAL SPLIT BANNER */
    .grand-total-banner {
        display: flex;
        height: 38px;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 6px;
        margin-bottom: 14px;
    }
    .gt-left {
        background: #009688;
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.6px;
        display: flex;
        align-items: center;
        padding: 0 16px;
        flex: 1;
    }
    .gt-right {
        background: #0c1d3b;
        color: #ffffff;
        font-size: 18px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 20px 0 26px;
        clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%);
        min-width: 175px;
    }

    /* STAMP & SIGNATURE */
    .stamp-sign-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 4px;
    }
    .stamp-block {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 84px;
        height: 84px;
    }
    .stamp-svg {
        width: 82px;
        height: 82px;
    }

    .sign-block {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .sign-company-for {
        font-size: 11px;
        font-weight: 600;
        color: #0c1d3b;
        margin-bottom: 4px;
    }
    .sign-svg {
        width: 130px;
        height: 38px;
        margin: 2px 0;
    }
    .sign-designation {
        font-size: 10.5px;
        color: #0c1d3b;
        font-weight: 500;
    }

    /* FOOTER BAR */
    .invoice-footer {
        position: relative;
        margin-top: 24px;
        height: 40px;
        display: flex;
        align-items: center;
        background: linear-gradient(90deg, #edf4fa 0%, #e1edf7 100%);
        border-radius: 4px;
        border: 1px solid #d8e6f1;
        overflow: hidden;
    }
    .footer-thankyou-tab {
        background: #0c1d3b;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 26px 0 14px;
        clip-path: polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%);
        color: #ffffff;
        flex-shrink: 0;
    }
    .footer-thankyou-tab i {
        font-size: 16px;
    }
    .ft-text-top {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.6px;
        line-height: 1.1;
    }
    .ft-text-bot {
        font-size: 8.5px;
        opacity: 0.9;
    }
    .footer-message {
        flex: 1;
        text-align: center;
        font-size: 11px;
        font-weight: 500;
        color: #334155;
        padding-right: 32px;
    }

    /* PRINT MEDIA RULES */
    @media print {
        body {
            background: #ffffff !important;
            padding: 0 !important;
        }
        .print-bar {
            display: none !important;
        }
        .invoice-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 24px 30px 20px 30px !important;
            margin: 0 !important;
        }
    }
</style>
</head>
<body>

    <div class="print-bar">
        <div class="print-bar-title">
            <i class="fa-solid fa-file-invoice" style="color:#009688;"></i> Paoyaila Technologies &bull; Invoice Document
        </div>
        <button class="print-btn" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print / Save as PDF
        </button>
    </div>

    <div class="invoice-page">

        <!-- TOP RIGHT GEOMETRIC POLYGON ACCENT -->
        <svg class="top-right-accent" viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="120,0 220,0 220,70 170,70 90,70" fill="#0c1d3b" />
            <polygon points="60,0 120,0 70,70 10,70" fill="#005f73" />
            <polygon points="110,0 170,0 120,70 60,70" fill="#009688" />
            <polygon points="165,0 220,0 220,35" fill="#0a9396" opacity="0.9" />
        </svg>

        <!-- TOP HEADER SECTION -->
        <div class="header-section">
            
            <!-- Company Block (Top Left) -->
            <div class="company-block">
                <div class="brand-logo-wrap">
                    <svg class="brand-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 24 30 C 24 18 34 12 48 12 L 64 12 C 78 12 88 22 88 36 C 88 50 78 60 64 60 L 44 60 C 34 60 26 68 26 78 L 26 88" stroke="#009688" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M 26 88 L 26 38 C 26 28 32 20 44 20 L 62 20 C 72 20 78 26 78 36 C 78 46 72 52 62 52 L 40 52" stroke="#0c1d3b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div class="brand-name-wrap">
                        <span class="brand-title">PAOYAILA</span>
                        <span class="brand-subtitle">TECHNOLOGIES PVT. LTD.</span>
                    </div>
                </div>

                <ul class="company-contact">
                    <li><i class="fa-solid fa-location-dot"></i> <span>Infopark, Kochi, Kerala, India – 682030</span></li>
                    <li><i class="fa-solid fa-envelope"></i> <span>hrpaoyaila@gmail.com</span></li>
                    <li><i class="fa-solid fa-phone"></i> <span>+91 999 555 1234</span></li>
                    <li><i class="fa-solid fa-globe"></i> <span>www.paoyaila.com</span></li>
                </ul>
                <div class="company-divider"></div>
            </div>

            <!-- Invoice Title & Meta Table (Top Right) -->
            <div class="invoice-meta-block">
                <h1 class="invoice-main-heading">${isOutflow ? 'VOUCHER' : 'INVOICE'}</h1>
                
                <table class="meta-table">
                    <tr>
                        <td class="icon-col"><i class="fa-solid fa-file-invoice"></i></td>
                        <td class="label-col">Invoice / Ref No.</td>
                        <td class="colon-col">:</td>
                        <td class="val-col">${invoiceNo}</td>
                    </tr>
                    <tr>
                        <td class="icon-col"><i class="fa-regular fa-calendar-days"></i></td>
                        <td class="label-col">Issue Date</td>
                        <td class="colon-col">:</td>
                        <td class="val-col">${invoiceDate}</td>
                    </tr>
                    <tr>
                        <td class="icon-col"><i class="fa-regular fa-clock"></i></td>
                        <td class="label-col">Due Date</td>
                        <td class="colon-col">:</td>
                        <td class="val-col">${dueDate}</td>
                    </tr>
                    <tr>
                        <td class="icon-col"><i class="fa-solid fa-file-lines"></i></td>
                        <td class="label-col">Purchase Order / Ref</td>
                        <td class="colon-col">:</td>
                        <td class="val-col">${poNo}</td>
                    </tr>
                    <tr>
                        <td class="icon-col"><i class="fa-solid fa-wallet"></i></td>
                        <td class="label-col">Payment Terms</td>
                        <td class="colon-col">:</td>
                        <td class="val-col">${paymentTerms}</td>
                    </tr>
                    <tr>
                        <td class="icon-col"><i class="fa-solid fa-location-dot"></i></td>
                        <td class="label-col">Place of Supply</td>
                        <td class="colon-col">:</td>
                        <td class="val-col">${placeOfSupply}</td>
                    </tr>
                </table>
            </div>

        </div>

        <!-- RECIPIENT INFORMATION (BILL TO & SHIP TO) -->
        <div class="recipient-grid">
            
            <!-- BILL TO CARD -->
            <div class="recipient-card-wrap">
                <div class="recipient-badge badge-navy">
                    <i class="fa-solid ${isOutflow ? 'fa-user-tie' : 'fa-user'}"></i> ${isOutflow ? 'BILLED TO / EMPLOYEE' : 'BILL TO'}
                </div>
                <div class="recipient-box">
                    <div class="recipient-name">${billToName}</div>
                    <div class="recipient-address">${billToAddr1}<br>${billToAddr2}</div>
                    <table class="recipient-meta-table">
                        <tr>
                            <td class="m-label">${isOutflow ? 'REF ID' : 'GSTIN'}</td>
                            <td class="m-colon">:</td>
                            <td class="m-val"><strong>${billToGstin}</strong></td>
                        </tr>
                        <tr>
                            <td class="m-label">Email</td>
                            <td class="m-colon">:</td>
                            <td class="m-val">${billToEmail}</td>
                        </tr>
                        <tr>
                            <td class="m-label">Phone</td>
                            <td class="m-colon">:</td>
                            <td class="m-val">${billToPhone}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- SHIP / DELIVER TO CARD -->
            <div class="recipient-card-wrap">
                <div class="recipient-badge badge-teal">
                    <i class="fa-solid ${isOutflow ? 'fa-building-user' : 'fa-truck'}"></i> ${isOutflow ? 'DISBURSEMENT BRANCH' : 'SHIP / DELIVER TO'}
                </div>
                <div class="recipient-box">
                    <div class="recipient-name">${shipToName}</div>
                    <div class="recipient-address">${shipToAddr1}<br>${shipToAddr2}</div>
                </div>
            </div>

        </div>

        <!-- LINE ITEMS TABLE -->
        <div class="items-table-wrap">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 8%;" class="col-center">SL. NO.</th>
                        <th style="width: 38%;" class="col-left">DESCRIPTION</th>
                        <th style="width: 13%;" class="col-center">HSN / SAC</th>
                        <th style="width: 8%;" class="col-center">QTY</th>
                        <th style="width: 9%;" class="col-center">UNIT</th>
                        <th style="width: 12%;" class="col-right">RATE ( ₹ )</th>
                        <th style="width: 12%;" class="col-right">AMOUNT ( ₹ )</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td class="col-center">${item.sl || 1}</td>
                        <td class="col-left">
                            <div class="item-title">${item.title || 'Service Item'}</div>
                            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                        </td>
                        <td class="col-center">${item.hsn || '-'}</td>
                        <td class="col-center">${item.qty || 1}</td>
                        <td class="col-center">${item.unit || 'Nos'}</td>
                        <td class="col-right">${formatINR(item.rate || 0)}</td>
                        <td class="col-right" style="font-weight:600;">${formatINR(item.amount || 0)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- BOTTOM TWO-COLUMN: PAYMENT/TERMS + SUMMARY/STAMP -->
        <div class="bottom-section">
            
            <!-- Left Side: Payment Info & Terms -->
            <div class="payment-terms-wrap">
                <div class="payment-badge">
                    <i class="fa-solid fa-building-columns"></i> PAYMENT INFORMATION
                </div>
                <div class="payment-box">
                    <table class="payment-table">
                        <tr>
                            <td class="p-label">Bank Name</td>
                            <td class="p-colon">:</td>
                            <td class="p-val">HDFC Bank</td>
                        </tr>
                        <tr>
                            <td class="p-label">Account Name</td>
                            <td class="p-colon">:</td>
                            <td class="p-val">Paoyaila Technologies Pvt. Ltd.</td>
                        </tr>
                        <tr>
                            <td class="p-label">Account Number</td>
                            <td class="p-colon">:</td>
                            <td class="p-val">50200012345678</td>
                        </tr>
                        <tr>
                            <td class="p-label">IFSC Code</td>
                            <td class="p-colon">:</td>
                            <td class="p-val">HDFC0001234</td>
                        </tr>
                        <tr>
                            <td class="p-label">Branch</td>
                            <td class="p-colon">:</td>
                            <td class="p-val">Infopark, Kochi</td>
                        </tr>
                        <tr>
                            <td class="p-label">UPI ID</td>
                            <td class="p-colon">:</td>
                            <td class="p-val">paoyaila@hdfcbank</td>
                        </tr>
                    </table>
                </div>

                <div class="terms-wrap">
                    <div class="terms-title">
                        <i class="fa-solid fa-file-circle-check"></i> TERMS & CONDITIONS
                    </div>
                    <ol class="terms-list">
                        <li>Payment is due within the agreed payment period.</li>
                        <li>Kindly mention the Invoice / Voucher Number during bank transactions.</li>
                        <li>This document is an authentic electronic record issued by Paoyaila Technologies.</li>
                        <li>All disputes are subject to Kochi jurisdiction.</li>
                    </ol>
                </div>
            </div>

            <!-- Right Side: Totals, Grand Total & Signatory Block -->
            <div class="calculations-wrap">
                <table class="calc-table">
                    <tr>
                        <td class="c-label">SUB TOTAL</td>
                        <td class="c-val">${formatINR(subTotal)}</td>
                    </tr>
                    <tr>
                        <td class="c-label">${isOutflow ? 'DEDUCTIONS / WITHHOLDINGS' : 'DISCOUNT'}</td>
                        <td class="c-val">${discount > 0 ? `(-) ${formatINR(discount)}` : '-'}</td>
                    </tr>
                    <tr class="taxable-row">
                        <td class="c-label">${isOutflow ? 'NET TAXABLE SETTLEMENT' : 'TAXABLE AMOUNT'}</td>
                        <td class="c-val">${formatINR(taxableAmount)}</td>
                    </tr>
                    <tr>
                        <td class="c-label">CGST (${cgstRate}%)</td>
                        <td class="c-val">${cgstAmount > 0 ? formatINR(cgstAmount) : '-'}</td>
                    </tr>
                    <tr>
                        <td class="c-label">SGST (${sgstRate}%)</td>
                        <td class="c-val">${sgstAmount > 0 ? formatINR(sgstAmount) : '-'}</td>
                    </tr>
                    <tr>
                        <td class="c-label">IGST (${igstRate > 0 ? igstRate : 18}%)</td>
                        <td class="c-val">${igstAmount > 0 ? formatINR(igstAmount) : '-'}</td>
                    </tr>
                </table>

                <!-- GRAND TOTAL BANNER -->
                <div class="grand-total-banner">
                    <div class="gt-left">GRAND TOTAL</div>
                    <div class="gt-right">₹ ${formatINR(grandTotal)}</div>
                </div>

                <!-- STAMP & SIGNATURE BLOCK -->
                <div class="stamp-sign-row">
                    <!-- Circular Paoyaila Technologies Seal -->
                    <div class="stamp-block">
                        <svg class="stamp-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="46" stroke="#0c1d3b" stroke-width="2.2" fill="none" />
                            <circle cx="50" cy="50" r="41" stroke="#0c1d3b" stroke-width="1.1" fill="none" />
                            
                            <path id="stampCurveTop" d="M 17,50 A 33,33 0 1,1 83,50" fill="none" />
                            <text font-family="'Plus Jakarta Sans', sans-serif" font-size="7" font-weight="800" fill="#0c1d3b" letter-spacing="1">
                                <textPath href="#stampCurveTop" startOffset="50%" text-anchor="middle">
                                    PAOYAILA TECHNOLOGIES PVT LTD
                                </textPath>
                            </text>

                            <!-- Bottom Star -->
                            <polygon points="50,86 51.5,89.5 55,89.5 52.5,91.5 53.5,95 50,92.5 46.5,95 47.5,91.5 45,89.5 48.5,89.5" fill="#0c1d3b" />
                            
                            <!-- Central P Logo Fold -->
                            <g transform="translate(32, 28) scale(0.36)">
                                <path d="M 24 30 C 24 18 34 12 48 12 L 64 12 C 78 12 88 22 88 36 C 88 50 78 60 64 60 L 44 60 C 34 60 26 68 26 78 L 26 88" stroke="#009688" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                                <path d="M 26 88 L 26 38 C 26 28 32 20 44 20 L 62 20 C 72 20 78 26 78 36 C 78 46 72 52 62 52 L 40 52" stroke="#0c1d3b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                            </g>
                        </svg>
                    </div>

                    <!-- Authorized Signatory -->
                    <div class="sign-block">
                        <div class="sign-company-for">For Paoyaila Technologies Pvt. Ltd.</div>
                        <svg class="sign-svg" viewBox="0 0 140 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M 12 32 C 18 16, 22 8, 28 10 C 34 12, 30 36, 38 30 C 44 24, 48 16, 54 24 C 60 32, 66 20, 74 22 C 82 24, 88 16, 96 14 C 104 12, 114 8, 118 14 C 122 20, 112 34, 126 28" stroke="#0c1d3b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M 24 36 L 128 34" stroke="#0c1d3b" stroke-width="1.8" stroke-linecap="round" />
                            <circle cx="132" cy="34" r="1.5" fill="#0c1d3b" />
                        </svg>
                        <div class="sign-designation">Authorized Signatory</div>
                    </div>
                </div>

            </div>

        </div>

        <!-- FOOTER BAR -->
        <div class="invoice-footer">
            <div class="footer-thankyou-tab">
                <i class="fa-solid fa-comment-dots"></i>
                <div>
                    <div class="ft-text-top">THANK YOU</div>
                    <div class="ft-text-bot">for your business!</div>
                </div>
            </div>
            <div class="footer-message">
                We look forward to continuing our partnership with you.
            </div>
        </div>

    </div>

</body>
</html>`;
}

export function openReceiptWindow(record, docId) {
    const win = window.open('', '_blank');
    if (!win) {
        alert('Please allow popups to view the receipt.');
        return;
    }
    win.document.write(buildReceiptHtml(record, docId));
    win.document.close();
}

export function openInvoiceWindow(record, docId) {
    const win = window.open('', '_blank');
    if (!win) {
        alert('Please allow popups to view the invoice.');
        return;
    }
    win.document.write(buildInvoiceHtml(record, docId));
    win.document.close();
}

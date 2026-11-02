import { LogoData } from '../types';

/**
 * خدمة توليد وتصدير فاتورة المنتجات والشعارات بصيغة PDF وتنسيق خط Cairo العربي
 * مطابقة تماماً لكود Flutter: PdfInvoiceService.generateInvoice
 */
export class PdfInvoiceService {
  /**
   * توليد وطباعة فاتورة الشعار والمنتج متطابقة مع تصميم Flutter
   */
  static printInvoice({
    productData,
    invoiceNumber,
    date = new Date(),
  }: {
    productData: LogoData;
    invoiceNumber: string;
    date?: Date;
  }): void {
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const priceDisplay = productData.price != null ? productData.price.toString() : 'غير محدد';
    const currencyDisplay = productData.currency || '';
    const totalDisplay = `${productData.price ?? 0} ${currencyDisplay}`.trim();

    const safeProductName = (productData.productName || 'مبيعات').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `فاتورة_${safeProductName}`;

    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) لمعاينة وطباعة الفاتورة');
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Cairo', sans-serif;
    }
    body {
      background-color: #f8fafc;
      padding: 30px 20px;
      color: #1e293b;
      display: flex;
      justify-content: center;
    }
    .page-container {
      background: #ffffff;
      width: 100%;
      max-width: 650px;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      min-height: 800px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }
    .header-meta {
      text-align: left;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .header-meta strong {
      color: #0f172a;
    }
    .divider {
      height: 1.5px;
      background-color: #cbd5e1;
      margin-bottom: 24px;
    }
    .brand-section {
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .weight-text {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }
    .table-container {
      width: 100%;
      margin: 16px 0 24px 0;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
    }
    th {
      background-color: #374151; /* blueGrey800 */
      color: #ffffff;
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 700;
      border-bottom: 1px solid #94a3b8;
    }
    td {
      padding: 10px 12px;
      font-size: 13px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      line-height: 1.5;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .total-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .total-badge {
      background-color: #e2e8f0; /* grey200 */
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .footer-section {
      margin-top: auto;
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
    }
    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .page-container {
        box-shadow: none;
        max-width: 100%;
        border-radius: 0;
        padding: 24px;
      }
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- رأس الفاتورة -->
    <div class="header-row">
      <h1 class="header-title">فاتورة مبيعات</h1>
      <div class="header-meta">
        <div><strong>رقم الفاتورة:</strong> #${invoiceNumber}</div>
        <div><strong>التاريخ:</strong> ${formattedDate}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- بيانات العلامة التجارية / المنتج -->
    <div class="brand-section">
      <div class="brand-title">العلامة التجارية: ${productData.brandName || 'غير محدد'}</div>
      ${
        productData.weightOrVolume
          ? `<div class="weight-text">الحجم / الوزن: ${productData.weightOrVolume}</div>`
          : ''
      }
    </div>

    <!-- جدول المنتجات والأسعار -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">اسم المنتج</th>
            <th style="width: 40%;">المواصفات</th>
            <th style="width: 15%;">السعر</th>
            <th style="width: 15%;">العملة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${productData.productName || '-'}</strong></td>
            <td>${productData.details || '-'}</td>
            <td>${priceDisplay}</td>
            <td>${currencyDisplay}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- إجمالي الفاتورة -->
    <div class="total-container">
      <div class="total-badge">
        الإجمالي: ${totalDisplay}
      </div>
    </div>

    <!-- التذييل -->
    <div class="footer-section">
      شكراً لتعاملكم معنا
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}

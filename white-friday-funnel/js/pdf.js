// ===================================
// PDF Generation Module
// Using jsPDF library (to be loaded via CDN)
// ===================================

/**
 * Generate PDF offer document
 * @param {Object} data - Offer data containing sector, city, bundles, period, pricing
 */
window.generateOfferPDF = function(data) {
  // Check if jsPDF is available
  if (typeof window.jspdf === 'undefined') {
    console.error('jsPDF library not loaded');
    alert('مكتبة PDF غير متوفرة. يرجى إعادة تحميل الصفحة.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Set font for RTL support
    doc.setLanguage('ar');
    doc.setR2L(true);

    // Header Section
    doc.setFillColor(11, 16, 35); // bg-start
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('الهدف الأمثل للتسويق', pageWidth - margin, 20, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(154, 164, 178); // muted
    doc.text('عرض خاص - الجمعة البيضاء', pageWidth - margin, 30, { align: 'right' });

    // Date
    doc.setFontSize(10);
    const currentDate = new Date().toLocaleDateString('ar-SA');
    doc.text(`التاريخ: ${currentDate}`, pageWidth - margin, 35, { align: 'right' });

    // Content Section
    let yPos = 55;

    // Business Info
    doc.setFontSize(16);
    doc.setTextColor(108, 99, 255); // primary
    doc.text('معلومات النشاط', pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`المجال: ${data.sector}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;
    doc.text(`المدينة: ${data.city || 'غير محدد'}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;
    doc.text(`مدة التعاقد: ${data.period}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // Selected Services
    doc.setFontSize(16);
    doc.setTextColor(108, 99, 255);
    doc.text('الخدمات المختارة', pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);

    data.bundles.forEach((bundle, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      // Bundle box
      doc.setDrawColor(31, 39, 71); // stroke
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(margin, yPos - 5, pageWidth - (2 * margin), 25, 3, 3, 'FD');

      // Bundle title
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(bundle.title, pageWidth - margin - 5, yPos + 2, { align: 'right' });

      // Bundle price
      doc.setFontSize(11);
      doc.setTextColor(33, 192, 139); // success
      const priceText = `${formatPriceForPDF(bundle.monthly)} / شهر`;
      doc.text(priceText, pageWidth - margin - 5, yPos + 9, { align: 'right' });

      // Features (first 2)
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const features = bundle.features.slice(0, 2).join(' • ');
      doc.text(features, pageWidth - margin - 5, yPos + 16, { align: 'right', maxWidth: pageWidth - (2 * margin) - 10 });

      yPos += 30;
    });

    // Pricing Summary
    yPos += 10;

    // Draw pricing box
    doc.setDrawColor(108, 99, 255);
    doc.setLineWidth(0.5);
    doc.setFillColor(240, 240, 255);
    doc.roundedRect(margin, yPos - 5, pageWidth - (2 * margin), 45, 3, 3, 'FD');

    doc.setFontSize(16);
    doc.setTextColor(108, 99, 255);
    doc.text('ملخص الأسعار', pageWidth - margin - 5, yPos + 3, { align: 'right' });

    yPos += 12;

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);

    // Subtotal
    doc.text('السعر قبل الخصم:', pageWidth - margin - 5, yPos, { align: 'right' });
    doc.text(formatPriceForPDF(data.pricing.subtotal), margin + 5, yPos, { align: 'left' });
    yPos += 7;

    // Discount
    if (data.pricing.discountAmount > 0) {
      doc.setTextColor(33, 192, 139);
      doc.text('التوفير:', pageWidth - margin - 5, yPos, { align: 'right' });
      doc.text(`- ${formatPriceForPDF(data.pricing.discountAmount)}`, margin + 5, yPos, { align: 'left' });
      yPos += 7;
    }

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
    yPos += 7;

    // Total
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(108, 99, 255);
    doc.text('الإجمالي:', pageWidth - margin - 5, yPos, { align: 'right' });
    doc.text(formatPriceForPDF(data.pricing.total), margin + 5, yPos, { align: 'left' });

    // Footer
    yPos = pageHeight - 30;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');

    doc.text('الهدف الأمثل للتسويق - OP Target', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.text('966569269336+ | www.optarget.sa', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(8);
    doc.text('هذا العرض صالح لفترة محدودة خلال عروض الجمعة البيضاء', pageWidth / 2, yPos, { align: 'center' });

    // Save PDF
    const fileName = `عرض-الجمعة-البيضاء-${data.sector}-${Date.now()}.pdf`;
    doc.save(fileName);

    // Show success message
    if (typeof showToast === 'function') {
      showToast('تم تحميل ملف PDF بنجاح!', 'success');
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('حدث خطأ في توليد ملف PDF');
  }
};

/**
 * Format price for PDF display
 * @param {number} amount
 * @returns {string}
 */
function formatPriceForPDF(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ر.س';
}

/**
 * Simple PDF export (text only, no jsPDF dependency)
 * Fallback for when jsPDF is not available
 */
window.generateSimplePDFText = function(data) {
  const text = `
الهدف الأمثل للتسويق - عرض الجمعة البيضاء
=============================================

معلومات النشاط:
- المجال: ${data.sector}
- المدينة: ${data.city || 'غير محدد'}
- مدة التعاقد: ${data.period}

الخدمات المختارة:
${data.bundles.map((b, i) => `${i + 1}. ${b.title} - ${formatPriceForPDF(b.monthly)} / شهر`).join('\n')}

ملخص الأسعار:
- السعر قبل الخصم: ${formatPriceForPDF(data.pricing.subtotal)}
${data.pricing.discountAmount > 0 ? `- التوفير: ${formatPriceForPDF(data.pricing.discountAmount)}` : ''}
- الإجمالي: ${formatPriceForPDF(data.pricing.total)}

للتواصل: 966569269336+
الموقع: www.optarget.sa

هذا العرض صالح لفترة محدودة خلال عروض الجمعة البيضاء.
  `;

  // Create blob and download
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `عرض-الجمعة-البيضاء-${data.sector}-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') {
    showToast('تم تحميل ملف العرض!', 'success');
  }
};

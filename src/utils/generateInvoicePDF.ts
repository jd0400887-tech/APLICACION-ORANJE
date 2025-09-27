import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Hotel, Adjustment } from '../data/database';

// Interfaces para los datos que necesita la factura
interface InvoiceDetails {
  employeeName: string;
  position: string;
  totalHours: string;
  totalChargeToHotel: string;
  adjustments: Adjustment[];
}

interface InvoiceData {
  invoiceDetails: InvoiceDetails[];
  totalCompanyCharge: string;
}

export const generateInvoicePDF = (
  invoiceData: InvoiceData,
  hotel: Hotel,
  weekStartDate: string
) => {
  const doc = new jsPDF();
  const issueDate = new Date().toLocaleDateString();
  const weekStart = new Date(weekStartDate).toLocaleDateString();

  // --- Encabezado ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA / INVOICE', 14, 22);

  // --- Información de la Compañía y Factura ---
  autoTable(doc, {
    startY: 30,
    body: [
      [
        { content: 'De:\nYour Company Name\n123 Your Street\nYour City, 12345', styles: { halign: 'left' } },
        { content: `Factura #: INV-${Date.now()}\nFecha: ${issueDate}\nPeriodo: ${weekStart}`, styles: { halign: 'right' } }
      ],
      [
        { content: `Facturar a:\n${hotel.name}\n${hotel.address || ''}\n${hotel.city || ''}, ${hotel.state || ''} ${hotel.postcode || ''}`, styles: { halign: 'left', fontStyle: 'bold' } },
        ''
      ]
    ],
    theme: 'plain'
  });

  // --- Items de la Factura (detallado por empleado) ---
  const payrollSettings = (hotel as any).payroll_settings || {};
  const overtimeMultiplier = payrollSettings.overtime_multiplier || 1.5;

  const mainTableBody = invoiceData.invoiceDetails.map(item => {
    const billRate = (hotel as any).billing_rates_by_position?.[item.position] || 0;
    const chargeForHours = (parseFloat(item.regularHours) * billRate) + (parseFloat(item.overtimeHours) * billRate * overtimeMultiplier);
    return [
      item.employeeName,
      item.position,
      item.regularHours,
      item.overtimeHours,
      `$${billRate.toFixed(2)}`,
      `$${chargeForHours.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Empleado', 'Posición', 'H. Reg.', 'H. OT', 'Tarifa/h', 'Subtotal']],
    body: mainTableBody,
    theme: 'striped',
    headStyles: { fillColor: [230, 126, 34], fontStyle: 'bold' },
  });

  // --- Tabla de Ajustes ---
  const adjustmentsBody: any[] = [];
  invoiceData.invoiceDetails.forEach(item => {
    if (item.adjustments.length > 0) {
      item.adjustments.forEach(adj => {
        // Asumimos que los ajustes se facturan 1:1
        adjustmentsBody.push([`${item.employeeName} - ${adj.description}`, `$${adj.amount.toFixed(2)}`]);
      });
    }
  });

  if (adjustmentsBody.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      head: [['Ajustes y Bonificaciones', 'Monto']],
      body: adjustmentsBody,
      theme: 'striped',
      headStyles: { fillColor: [243, 156, 18], fontStyle: 'bold' },
    });
  }

  // --- Total ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL A PAGAR:', 14, finalY);
  doc.text(`$${invoiceData.totalCompanyCharge}`, 200, finalY, { align: 'right' });

  // --- Pie de Página ---
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gracias por su negocio.', 14, pageHeight - 10);

  // --- Guardar el PDF ---
  doc.save(`factura-${hotel.name.replace(/ /g, '_')}-${weekStartDate}.pdf`);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Hotel, Adjustment } from '../data/database';

// Definimos una interfaz para los datos que necesita el desprendible
interface PayStubData {
  employee: {
    id: string;
    name: string;
    position: string;
  };
  weekStartDate: string;
  regularHours: number;
  overtimeHours: number;
  basePay: number;
  totalPay: number;
  adjustments: Adjustment[];
}

export const generatePayStubPDF = (
  employeeData: PayStubData,
  hotel: Hotel,
  weekStartDate: string
) => {
  const doc = new jsPDF();

  const weekStart = new Date(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const payPeriod = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;

  // --- Encabezado ---
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Desprendible de Pago', 14, 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(hotel.name, 14, 30);

  // --- Información del Empleado y Periodo ---
  autoTable(doc, {
    startY: 38,
    body: [
      [
        { content: 'Empleado:', styles: { fontStyle: 'bold' } },
        employeeData.employee.name,
        { content: 'Periodo de Pago:', styles: { fontStyle: 'bold' } },
        payPeriod,
      ],
      [
        { content: 'Posición:', styles: { fontStyle: 'bold' } },
        employeeData.employee.position,
        '',
        '',
      ],
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
  });

  const earnings = employeeData.adjustments.filter(adj => adj.type === 'addition');
  const deductions = employeeData.adjustments.filter(adj => adj.type === 'deduction');
  const grossPay = employeeData.basePay + earnings.reduce((acc, adj) => acc + adj.amount, 0);
  const totalDeductions = deductions.reduce((acc, adj) => acc + adj.amount, 0);

  // --- Tabla de Ingresos ---
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Ingresos', 'Monto']],
    body: [
      ['Pago Base (Horas)', `$${employeeData.basePay.toFixed(2)}`],
      ...earnings.map(adj => [adj.description, `+$${adj.amount.toFixed(2)}`]),
    ],
    foot: [[{ content: 'Pago Bruto', styles: { fontStyle: 'bold' } }, `$${grossPay.toFixed(2)}`]],
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133], fontStyle: 'bold' },
    footStyles: { fontStyle: 'bold', fontSize: 11 },
  });

  // --- Tabla de Deducciones ---
  if (deductions.length > 0) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Deducciones', 'Monto']],
      body: deductions.map(adj => [adj.description, `-$${adj.amount.toFixed(2)}`]),
      foot: [[{ content: 'Total Deducciones', styles: { fontStyle: 'bold' } }, `-$${totalDeductions.toFixed(2)}`]],
      theme: 'striped',
      headStyles: { fillColor: [192, 57, 43], fontStyle: 'bold' },
      footStyles: { fontStyle: 'bold', fontSize: 11 },
    });
  }

  // --- Resumen Final ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAGO NETO:', 14, finalY);
  doc.text(`$${employeeData.totalPay.toFixed(2)}`, 200, finalY, { align: 'right' });

  // --- Guardar el PDF ---
  doc.save(`desprendible-${employeeData.employee.name.replace(/ /g, '_')}-${weekStartDate}.pdf`);
};

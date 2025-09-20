import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PaymentRecord } from "./payment-types";

export async function generatePayslipPDF(record: PaymentRecord, payslipHtml: string) {
  // Create a temporary container for the HTML
  const container = document.createElement('div');
  container.innerHTML = payslipHtml;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  // Use html2canvas to render the HTML to a canvas
  const canvas = await html2canvas(container);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`payslip-${record.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  document.body.removeChild(container);
}

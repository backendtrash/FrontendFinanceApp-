import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportPdf(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(title, 14, 18)
  autoTable(doc, {
    head: [columns],
    body: rows.map(r => r.map(String)),
    startY: 26,
    styles: { fontSize: 9 },
  })
  doc.save(`${filename}.pdf`)
}

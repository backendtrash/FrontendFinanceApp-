import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportData {
  month:      string
  year:       number
  monthName:  string
  dashboard:  any
  expenses:   any[]
  earnings:   any[]
  categories: any[]
  budgets:    any[]
  goals:      any[]
  currencies: any[]
}

const formatMXN = (amount: number | string): string =>
  new Intl.NumberFormat('es-MX', {
    style:                 'currency',
    currency:              'MXN',
    minimumFractionDigits: 2,
  }).format(Number(amount))

const formatPct = (value: number | string): string =>
  `${Number(value).toFixed(1)}%`

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)]
    : [99, 102, 241]
}

export async function generateMonthlyReport(data: ReportData): Promise<void> {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 14
  let   y      = 0

  // ── Color palette ──────────────────────────────────────────────────────
  const navy:      [number,number,number] = [26,  58,  107]
  const indigo:    [number,number,number] = [79,  70,  229]
  const green:     [number,number,number] = [22,  163, 74 ]
  const red:       [number,number,number] = [220, 38,  38 ]
  const amber:     [number,number,number] = [217, 119, 6  ]
  const gray:      [number,number,number] = [107, 114, 128]
  const lightGray: [number,number,number] = [248, 250, 252]
  const white:     [number,number,number] = [255, 255, 255]
  const darkText:  [number,number,number] = [17,  24,  39 ]
  const mutedText: [number,number,number] = [156, 163, 175]

  // ── Helpers ────────────────────────────────────────────────────────────
  const addPage = () => {
    doc.addPage()
    // Subtle top stripe on each page
    doc.setFillColor(...navy)
    doc.rect(0, 0, pageW, 1.5, 'F')
    y = 12
  }

  const checkY = (needed: number) => {
    if (y + needed > pageH - 15) addPage()
  }

  const sectionTitle = (title: string) => {
    checkY(12)
    doc.setFillColor(...indigo)
    doc.rect(margin, y, 3, 6, 'F')
    doc.setTextColor(...indigo)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(title.toUpperCase(), margin + 5, y + 4.5)
    y += 10
  }

  // ── Cover / Header ─────────────────────────────────────────────────────
  // Top gradient band
  doc.setFillColor(...navy)
  doc.rect(0, 0, pageW, 42, 'F')

  // Decorative accent circle
  doc.setFillColor(255, 255, 255, 0.05)
  doc.setDrawColor(...indigo)
  doc.setLineWidth(0.3)
  doc.circle(pageW - 20, -5, 30, 'D')
  doc.circle(pageW - 10, 50, 20, 'D')

  // App name
  doc.setTextColor(...white)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Budget Tracker', margin, 18)

  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(147, 197, 253) // blue-300
  doc.text('Monthly Financial Report', margin, 26)

  // Month + year — right side
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...white)
  doc.text(`${data.monthName} ${data.year}`, pageW - margin, 18, { align: 'right' })

  // Generated date
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(147, 197, 253)
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  doc.text(`Generated ${today}`, pageW - margin, 26, { align: 'right' })

  y = 52

  // ── Summary Cards Row ──────────────────────────────────────────────────
  const cardW   = (pageW - margin * 2 - 9) / 4
  const cardH   = 22
  const cards   = [
    {
      label: 'Total Income',
      value: formatMXN(data.dashboard?.total_income   ?? 0),
      color: green,
      bg:    [240, 253, 244] as [number,number,number],
    },
    {
      label: 'Total Expenses',
      value: formatMXN(data.dashboard?.total_expenses ?? 0),
      color: red,
      bg:    [254, 242, 242] as [number,number,number],
    },
    {
      label: 'Net Balance',
      value: formatMXN(data.dashboard?.net_balance    ?? 0),
      color: Number(data.dashboard?.net_balance ?? 0) >= 0 ? indigo : red,
      bg:    [238, 242, 255] as [number,number,number],
    },
    {
      label: 'Savings Rate',
      value: formatPct(data.dashboard?.savings_rate   ?? 0),
      color: amber,
      bg:    [255, 251, 235] as [number,number,number],
    },
  ]

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 3)
    // Card background
    doc.setFillColor(...card.bg)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F')
    // Left accent bar
    doc.setFillColor(...card.color)
    doc.roundedRect(x, y, 2.5, cardH, 1, 1, 'F')
    // Label
    doc.setTextColor(...gray)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 5, y + 7)
    // Value
    doc.setTextColor(...card.color)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 5, y + 16)
  })

  y += cardH + 10

  // ── Spending by Category ───────────────────────────────────────────────
  if (data.categories?.length > 0) {
    sectionTitle('Spending by Category')

    const topCats  = data.categories.slice(0, 8)
    const maxAmt   = Math.max(...topCats.map(c => Number(c.total_amount)))
    const barMaxW  = pageW - margin * 2 - 58

    topCats.forEach(cat => {
      checkY(9)
      const amt   = Number(cat.total_amount)
      const pct   = Number(cat.pct_of_total)
      const barW  = maxAmt > 0 ? (amt / maxAmt) * barMaxW : 0
      const rgb   = hexToRgb(cat.color || '#6366F1')

      // Category dot + name
      doc.setFillColor(...rgb)
      doc.circle(margin + 2, y + 2.5, 2, 'F')
      doc.setTextColor(...darkText)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        cat.category_name.length > 18
          ? cat.category_name.slice(0, 18) + '…'
          : cat.category_name,
        margin + 6, y + 3.5
      )

      // Bar background
      doc.setFillColor(...lightGray)
      doc.roundedRect(margin + 44, y + 0.5, barMaxW, 4.5, 1, 1, 'F')
      // Bar fill
      if (barW > 0) {
        doc.setFillColor(...rgb)
        doc.roundedRect(margin + 44, y + 0.5, Math.max(barW, 2), 4.5, 1, 1, 'F')
      }

      // Amount + pct
      doc.setTextColor(...gray)
      doc.setFontSize(7)
      doc.text(
        `${formatMXN(amt)}  ${pct.toFixed(1)}%`,
        pageW - margin,
        y + 3.5,
        { align: 'right' }
      )

      y += 8
    })

    y += 4
  }

  // ── Budget Progress ────────────────────────────────────────────────────
  if (data.budgets?.length > 0) {
    checkY(30)
    sectionTitle('Budget Progress')

    const budgetRows = data.budgets.map((b: any) => {
      const pct    = Number(b.pct_spent)
      const status = pct >= 100 ? 'OVER' : pct >= 80 ? 'WARNING' : 'OK'
      return [
        b.category_name,
        b.period,
        formatMXN(b.spent_amount),
        formatMXN(b.limit_amount),
        formatPct(pct),
        status,
      ]
    })

    autoTable(doc, {
      startY:     y,
      head:       [['Category', 'Period', 'Spent', 'Limit', '%', 'Status']],
      body:       budgetRows,
      margin:     { left: margin, right: margin },
      styles:     {
        fontSize:    8,
        cellPadding: 2.5,
        textColor:   darkText,
      },
      headStyles: {
        fillColor:  navy,
        textColor:  white,
        fontStyle:  'bold',
        fontSize:   8,
      },
      alternateRowStyles: { fillColor: lightGray },
      columnStyles: {
        0: { cellWidth: 40 },
        5: { halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (hookData: any) => {
        if (hookData.column.index === 5) {
          const v = hookData.cell.raw
          if (v === 'OVER')    hookData.cell.styles.textColor = red
          else if (v === 'WARNING') hookData.cell.styles.textColor = amber
          else                 hookData.cell.styles.textColor = green
        }
      },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Goals Progress ─────────────────────────────────────────────────────
  if (data.goals?.length > 0) {
    checkY(30)
    sectionTitle('Goals Progress')

    const goalRows = data.goals.map((g: any) => {
      if (g.type === 'monthly_rate') {
        return [
          g.name,
          'Monthly Rate',
          `${formatPct(Number(g.current_rate_pct ?? 0))} saved`,
          `${formatPct(Number(g.target_rate_pct  ?? 0))} target`,
          g.on_track ? 'ON TRACK' : 'OFF TRACK',
        ]
      }
      return [
        g.name,
        'Fixed Amount',
        formatMXN(Number(g.current_savings ?? 0)),
        formatMXN(Number(g.target_amount   ?? 0)),
        formatPct(Number(g.pct_complete    ?? 0)),
      ]
    })

    autoTable(doc, {
      startY:     y,
      head:       [['Goal', 'Type', 'Current', 'Target', 'Progress']],
      body:       goalRows,
      margin:     { left: margin, right: margin },
      styles:     { fontSize: 8, cellPadding: 2.5, textColor: darkText },
      headStyles: { fillColor: indigo, textColor: white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: lightGray },
      didParseCell: (hookData: any) => {
        if (hookData.column.index === 4) {
          const v = String(hookData.cell.raw)
          if (v === 'ON TRACK') hookData.cell.styles.textColor = green
          if (v === 'OFF TRACK') hookData.cell.styles.textColor = red
        }
      },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Expenses Table ─────────────────────────────────────────────────────
  if (data.expenses?.length > 0) {
    checkY(30)
    sectionTitle(`Expenses  (${data.expenses.length} transactions)`)

    const expenseRows = data.expenses.slice(0, 60).map((e: any) => [
      e.date,
      e.notes ?? '—',
      formatMXN(e.amount_mxn),
    ])

    autoTable(doc, {
      startY:     y,
      head:       [['Date', 'Description', 'Amount (MXN)']],
      body:       expenseRows,
      margin:     { left: margin, right: margin },
      styles:     { fontSize: 7.5, cellPadding: 2, textColor: darkText },
      headStyles: { fillColor: red, textColor: white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: lightGray },
      columnStyles: {
        0: { cellWidth: 24 },
        2: { halign: 'right', fontStyle: 'bold' },
      },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Earnings Table ─────────────────────────────────────────────────────
  if (data.earnings?.length > 0) {
    checkY(30)
    sectionTitle(`Earnings  (${data.earnings.length} transactions)`)

    const earningRows = data.earnings.slice(0, 60).map((e: any) => [
      e.date,
      e.notes ?? '—',
      formatMXN(e.amount_mxn),
    ])

    autoTable(doc, {
      startY:     y,
      head:       [['Date', 'Description', 'Amount (MXN)']],
      body:       earningRows,
      margin:     { left: margin, right: margin },
      styles:     { fontSize: 7.5, cellPadding: 2, textColor: darkText },
      headStyles: { fillColor: green, textColor: white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: lightGray },
      columnStyles: {
        0: { cellWidth: 24 },
        2: { halign: 'right', fontStyle: 'bold', textColor: green },
      },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Footer on every page ───────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer bar
    doc.setFillColor(...lightGray)
    doc.rect(0, pageH - 10, pageW, 10, 'F')

    // Left accent
    doc.setFillColor(...indigo)
    doc.rect(0, pageH - 10, 3, 10, 'F')

    doc.setTextColor(...mutedText)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Budget Tracker  ·  ${data.monthName} ${data.year}`,
      margin + 2,
      pageH - 4
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageW - margin,
      pageH - 4,
      { align: 'right' }
    )
  }

  doc.save(`budget-report-${data.year}-${String(data.month).padStart(2,'0')}.pdf`)
}
/**
 * One-click compliance PDF report generator.
 * Uses jsPDF + jspdf-autotable (pure client-side, no backend needed).
 *
 * Props:
 *   data     {object}  — detailed compliance response from /compliance/score/detailed
 *   controls {Array}   — full controls list from /controls/
 *   orgName  {string}  — organisation name from user context
 */
import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportExport({ data, controls = [], orgName = 'Your Organisation' }) {
  const [busy, setBusy] = useState(false)

  function generatePDF() {
    setBusy(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const now  = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
      const W    = doc.internal.pageSize.getWidth()

      // ── Header bar ──────────────────────────────────────────────────────
      doc.setFillColor(15, 17, 26)
      doc.rect(0, 0, W, 28, 'F')

      doc.setTextColor(230, 237, 243)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('RegIntel AI', 14, 12)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(139, 148, 158)
      doc.text('Compliance Report', 14, 20)
      doc.text(`Generated: ${now}`, W - 14, 20, { align: 'right' })

      // ── Organisation info ────────────────────────────────────────────────
      let y = 36
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 37, 50)
      doc.text(orgName, 14, y)

      // ── Score summary box ─────────────────────────────────────────────────
      y += 8
      const score = data?.compliance_score ?? 0
      const grade = data?.grade ?? 'F'
      const scoreColor = score >= 75 ? [63, 185, 80] : score >= 40 ? [210, 153, 34] : [248, 81, 73]

      doc.setFillColor(...scoreColor, 15)
      doc.roundedRect(14, y, W - 28, 24, 3, 3, 'F')
      doc.setDrawColor(...scoreColor)
      doc.roundedRect(14, y, W - 28, 24, 3, 3, 'S')

      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...scoreColor)
      doc.text(`${score}%`, 22, y + 16)

      doc.setFontSize(11)
      doc.setTextColor(50, 60, 80)
      doc.text(`Grade: ${grade}`, 55, y + 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(
        score >= 75 ? 'Compliance posture is PASSING' :
        score >= 40 ? 'Compliance posture is AT RISK — action required' :
                     'Compliance posture is CRITICAL — immediate action required',
        55, y + 17
      )

      const by_status = data?.by_status ?? {}
      doc.text(
        `Controls: ${data?.total_controls ?? 0} total  |  ` +
        `${by_status.IMPLEMENTED ?? 0} implemented  |  ` +
        `${by_status.PARTIAL ?? 0} partial  |  ` +
        `${by_status.MISSING ?? 0} missing`,
        55, y + 23
      )

      // ── Risk Matrix table ─────────────────────────────────────────────────
      y += 32
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 37, 50)
      doc.text('Risk × Status Matrix (risk-weighted scoring)', 14, y)
      y += 4

      const riskLevels = ['HIGH', 'MEDIUM', 'LOW']
      const weights    = { HIGH: 10, MEDIUM: 5, LOW: 2 }
      const matrixBody = riskLevels.map((risk) => {
        const r = data?.by_risk?.[risk] ?? {}
        return [
          `${risk}  (weight: ${weights[risk]})`,
          r.implemented ?? 0,
          r.partial ?? 0,
          r.missing ?? 0,
          r.total ?? 0,
        ]
      })

      autoTable(doc, {
        startY: y,
        head: [['Risk Level', 'Implemented ✓', 'Partial ⚠', 'Missing ✗', 'Total']],
        body: matrixBody,
        theme: 'grid',
        styles:     { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 37, 50], textColor: [230, 237, 243], fontStyle: 'bold' },
        columnStyles: {
          1: { textColor: [63, 185, 80]  },
          2: { textColor: [210, 153, 34] },
          3: { textColor: [248, 81, 73]  },
        },
      })

      // ── Controls detail table ────────────────────────────────────────────
      if (controls.length > 0) {
        y = doc.lastAutoTable.finalY + 10
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 37, 50)
        doc.text('Control Inventory', 14, y)
        y += 4

        const controlBody = controls.map((c) => [
          c.title,
          c.risk_score ?? 'MEDIUM',
          c.status ?? 'MISSING',
          c.ai_suggested_risk ?? '—',
          c.ai_category       ?? '—',
        ])

        autoTable(doc, {
          startY: y,
          head: [['Control Title', 'Risk', 'Status', 'AI Risk', 'AI Category']],
          body: controlBody,
          theme: 'striped',
          styles:     { fontSize: 8, cellPadding: 2, overflow: 'linebreak', cellWidth: 'wrap' },
          headStyles: { fillColor: [30, 37, 50], textColor: [230, 237, 243], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 60 } },
        })
      }

      // ── Footer ────────────────────────────────────────────────────────────
      const pages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(180, 180, 180)
        doc.text(
          `RegIntel AI  |  Confidential  |  Page ${i} of ${pages}`,
          W / 2, doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        )
      }

      // ── Save ──────────────────────────────────────────────────────────────
      const safeName = orgName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      doc.save(`regintel_compliance_${safeName}_${now.replace(/\s/g, '_')}.pdf`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={busy || !data}
      className="btn btn-sm"
      style={{
        background: '#21262d',
        border: '1px solid #30363d',
        color: '#c9d1d9',
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      }}
    >
      {busy ? (
        <><span className="spinner-border spinner-border-sm" /> Generating…</>
      ) : (
        <><i className="bi bi-file-earmark-pdf" style={{ color: '#f85149' }} /> Export PDF</>
      )}
    </button>
  )
}

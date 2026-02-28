/**
 * Skeleton shimmer rows — used while table data is loading.
 * @param {{ cols?: number, rows?: number }} props
 */
export function TableSkeleton({ cols = 5, rows = 6 }) {
  return (
    <div className="table-responsive">
      <table className="table rg-table mb-0">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="rg-skeleton" style={{ width: i === 0 ? '140px' : '80px', height: '12px' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <div
                    className="rg-skeleton"
                    style={{
                      width: c === 0 ? `${70 + (r * 11) % 30}%` : `${50 + (c * 17 + r * 7) % 40}%`,
                      height: c === 0 ? '28px' : '20px',
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Skeleton card block — used while metric cards are loading.
 * @param {{ height?: number }} props
 */
export function CardSkeleton({ height = 80 }) {
  return (
    <div className="rg-card">
      <div className="rg-skeleton" style={{ width: '60%', height: '14px', marginBottom: '0.75rem' }} />
      <div className="rg-skeleton" style={{ width: '40%', height: height + 'px' }} />
    </div>
  )
}

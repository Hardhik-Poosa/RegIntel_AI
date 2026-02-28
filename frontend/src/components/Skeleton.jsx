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

/**
 * Full dashboard skeleton — mirrors the real layout during initial load.
 */
export function DashboardSkeleton() {
  return (
    <div>
      {/* Welcome bar */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="rg-skeleton" style={{ width: '220px', height: '22px', marginBottom: '8px' }} />
          <div className="rg-skeleton" style={{ width: '300px', height: '14px' }} />
        </div>
        <div className="rg-skeleton" style={{ width: '130px', height: '34px', borderRadius: '8px' }} />
      </div>

      {/* 4 metric cards */}
      <div className="row g-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <div className="col-6 col-xl-3" key={i}>
            <div className="rg-card">
              <div className="d-flex align-items-center justify-content-between">
                <div style={{ flex: 1 }}>
                  <div className="rg-skeleton" style={{ width: '50%', height: '28px', marginBottom: '8px' }} />
                  <div className="rg-skeleton" style={{ width: '75%', height: '13px' }} />
                </div>
                <div className="rg-skeleton" style={{ width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3 chart card skeletons */}
      <div className="row g-3 mb-4">
        {[160, 180, 200].map((h, i) => (
          <div className="col-12 col-lg-4" key={i}>
            <div className="rg-card" style={{ minHeight: `${h + 60}px` }}>
              <div className="rg-skeleton" style={{ width: '60%', height: '14px', marginBottom: '1rem' }} />
              <div className="rg-skeleton" style={{ width: '100%', height: `${h}px`, borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity table skeleton */}
      <div className="rg-card">
        <div className="rg-skeleton" style={{ width: '160px', height: '14px', marginBottom: '1.25rem' }} />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="d-flex justify-content-between align-items-center py-2"
            style={{ borderBottom: '1px solid #21262d' }}
          >
            <div className="rg-skeleton" style={{ width: '28%', height: '13px' }} />
            <div className="rg-skeleton" style={{ width: '18%', height: '13px' }} />
            <div className="rg-skeleton" style={{ width: '22%', height: '13px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

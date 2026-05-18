import { useLocation, useParams } from 'react-router-dom'

export function TripDetailPage() {
  const { tripId } = useParams()
  const location = useLocation()

  const state = location.state as { tripName?: string } | null
  const tripName = state?.tripName ?? '여행 일정'

  return (
    <main
      style={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 20px',
        background: '#ffffff',
      }}
    >
      <section style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#111827' }}>
          {tripName}
        </h1>
        <p style={{ margin: '12px 0 0', color: '#6b7280' }}>
          tripId: {tripId}
        </p>
      </section>
    </main>
  )
}

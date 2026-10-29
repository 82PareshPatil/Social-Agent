'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return <section style={{ padding: '4rem', fontFamily: 'Arial, sans-serif' }}>
    <h1>We couldn’t load your workspace</h1><p>Your profile could not be saved or loaded. Please try again.</p>
    <button onClick={reset}>Try again</button>
  </section>;
}

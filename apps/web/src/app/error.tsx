'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container">
      <div className="empty-state">
        <h1 className="section-title" style={{ marginTop: 0 }}>
          Unable to load this page
        </h1>
        <p>The tournament data could not be reached. Please try again.</p>
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}

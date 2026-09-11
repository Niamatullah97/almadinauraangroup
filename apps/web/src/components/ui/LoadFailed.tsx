interface LoadFailedProps {
  retryHref?: string;
}

export function LoadFailed({ retryHref = '/' }: LoadFailedProps) {
  return (
    <div className="empty-state">
      <p>Tournaments could not be loaded right now. Please try again.</p>
      <a href={retryHref} className="btn btn-primary">
        Try again
      </a>
    </div>
  );
}

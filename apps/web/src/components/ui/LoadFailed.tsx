interface LoadFailedProps {
  retryHref?: string;
  onRetry?: () => void;
  message?: string;
}

export function LoadFailed({
  retryHref = '/',
  onRetry,
  message = 'Tournaments could not be loaded right now. Please try again.',
}: LoadFailedProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      ) : (
        <a href={retryHref} className="btn btn-primary">
          Try again
        </a>
      )}
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "2rem", maxWidth: "28rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Something went wrong</h1>
            <p style={{ color: "#64748b", margin: "0 0 1.5rem" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#0e8a6c",
                color: "#fff",
                fontWeight: 600,
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
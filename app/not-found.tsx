export default function NotFound() {
  return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "2rem", maxWidth: "28rem" }}>
        <p style={{ fontSize: "3.5rem", fontWeight: 700, color: "#0e8a6c", margin: 0 }} aria-hidden>
          404
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.75rem 0 0.5rem" }}>Page not found</h1>
        <p style={{ color: "#64748b", margin: "0 0 1.5rem" }}>The page you are looking for does not exist or has been moved.</p>
        <a
          href="/"
          style={{
            display: "inline-block",
            background: "#0e8a6c",
            color: "#fff",
            fontWeight: 600,
            padding: "0.625rem 1.25rem",
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
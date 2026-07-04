export default function StatusView({ title, detail }) {
  return (
    <main style={styles.statusPage}>
      <div style={styles.statusCard}>
        <img src="/logo.png" alt="Studio Photuna" style={styles.statusLogo} />
        <p style={styles.statusTitle}>{title}</p>
        {detail && <p style={styles.statusDetail}>{detail}</p>}
      </div>
    </main>
  );
}

const styles = {
  statusPage: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    background: "#f4f4f5",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  statusCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    background: "#ffffff",
    padding: "28px 20px",
    textAlign: "center",
    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
  },
  statusLogo: {
    width: 190,
    maxWidth: "80%",
    height: "auto",
    marginBottom: 18,
  },
  statusTitle: {
    margin: 0,
    color: "#111111",
    fontSize: 21,
    fontWeight: 900,
  },
  statusDetail: {
    margin: "10px 0 0",
    color: "#666666",
    fontSize: 14,
    lineHeight: 1.45,
  },
};

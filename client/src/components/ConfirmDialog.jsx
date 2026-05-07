function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "white",
        borderRadius: 12,
        padding: 32,
        maxWidth: 400,
        width: "90%",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <p style={{ fontSize: 16, color: "#222", marginBottom: 24 }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button className="secondary-button" style={{ marginTop: 0 }} onClick={onCancel}>
            Отмена
          </button>
          <button
            style={{
              padding: "10px 16px",
              border: "none",
              background: "#c0392b",
              color: "white",
              borderRadius: 8,
              cursor: "pointer",
            }}
            onClick={onConfirm}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

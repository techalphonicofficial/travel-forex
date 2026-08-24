export default function Loading() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(var(--color-primary-rgb), 0.1)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{
        marginTop: '20px',
        color: '#64748b',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: '0.5px'
      }}>
        Loading amazing experiences...
      </p>
    </div>
  );
}

import React from 'react';

export function SignatureDialog(props: { open: boolean; onClose: () => void }) {
  // Componente placeholder. Implemente conforme necessário.
  if (!props.open) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #ccc', padding: 24 }}>
      <h2>Assinatura</h2>
      <button onClick={props.onClose}>Fechar</button>
    </div>
  );
}

import React from 'react';

const ErrorMessage = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '10px',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      maxWidth: '80%',
      zIndex: 1000
    }}>
      <h3>Error</h3>
      <p>{error.message}</p>
      {error.details && <p>Details: {error.details}</p>}
      {error.stdout && <pre>Stdout: {error.stdout}</pre>}
      {error.stderr && <pre>Stderr: {error.stderr}</pre>}
      <button onClick={onClose} style={{
        backgroundColor: '#721c24',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '3px',
        cursor: 'pointer'
      }}>Close</button>
    </div>
  );
};

export default ErrorMessage;

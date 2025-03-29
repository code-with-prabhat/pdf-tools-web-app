import React from 'react';

const CompressionPlaceholder = () => {
  return (
    <div className="card">
      <h2>PDF Compression</h2>
      <p>This feature is coming soon! Stay tuned for updates.</p>
      
      <div style={{ 
        padding: '2rem', 
        border: '2px dashed var(--border-color)',
        borderRadius: '4px',
        textAlign: 'center',
        margin: '2rem 0'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
        <h3>Under Construction</h3>
        <p>We're working hard to bring you the ability to compress PDF files without losing quality.</p>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <h4>Features to expect:</h4>
        <ul>
          <li>Intelligent compression algorithms</li>
          <li>Multiple compression levels</li>
          <li>Before/after size comparison</li>
          <li>Batch processing</li>
        </ul>
      </div>
    </div>
  );
};

export default CompressionPlaceholder; 
// A simple test component with state to isolate the issue.
import React, { useState } from 'react';

function App() {
  const [message, setMessage] = useState("Please click the button.");

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif', fontSize: '1.2rem' }}>
      <h1>Intermediate Test Page</h1>
      <p style={{ margin: '20px', color: 'blue' }}>
        {message}
      </p>
      <button 
        onClick={() => setMessage("Great! The button and React state are working.")}
        style={{ padding: '10px 20px', fontSize: '1rem' }}
      >
        Click Me
      </button>
    </div>
  );
}

export default App;

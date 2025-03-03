import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import database initialization module
// This will initialize the database connection and synchronize data
import './utils/initDatabase'

// Log application startup
console.log('Application starting...')

createRoot(document.getElementById("root")!).render(<App />);

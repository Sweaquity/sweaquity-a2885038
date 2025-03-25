
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("Starting application bootstrap...");
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Could not find root element to mount the application");
} else {
  console.log("Found root element, mounting application");
  const root = createRoot(rootElement);
  console.log("Created root, rendering App component");
  root.render(<App />);
  console.log("App component rendered");
}

/**
 * Main Entry Point
 * 
 * IMPORTANT: OpenTelemetry MUST be initialized before React renders
 * This ensures all React operations are traced from the start
 */

// ============================================================================
// STEP 1: Initialize OpenTelemetry (FIRST!)
// ============================================================================
import './telemetry/telemetry.js';

// ============================================================================
// STEP 2: Import React and other dependencies
// ============================================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ============================================================================
// STEP 3: Render React App
// ============================================================================
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import GeneratedSidequests from './pages/GeneratedSidequests.tsx';
import FlightSearch from './pages/FlightSearch.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/generated/sidequests" element={<GeneratedSidequests />} />
                <Route path="/flights" element={<FlightSearch />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);

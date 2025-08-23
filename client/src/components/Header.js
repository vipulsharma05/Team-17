import React, { useState, useEffect } from 'react';

const Header = ({ apiStatus }) => {
    const [aiStatus, setAiStatus] = useState('Connecting...');

    useEffect(() => {
        setTimeout(() => {
            setAiStatus('Active');
        }, 3000);
    }, []);

    return (
        <header className="header">
            <div className="logo">🚨 DisasterResponse Pro</div>
            <div className="status-bar">
                <div className="status-item">
                    <div className={`status-dot ${aiStatus === 'Active' ? 'status-active' : ''}`} id="ai-status-dot"></div>
                    <span>AI Triage: {aiStatus}</span>
                </div>
                <div className="status-item">
                    <div className="status-dot status-warning"></div>
                    <span id="active-incidents-header">0 Active Incidents</span>
                </div>
                <div className="status-item">
                    <div className="status-dot status-active"></div>
                    <span id="volunteers-online">156 Volunteers Online</span>
                </div>
                <div className="connection-status">
                    <div className={`status-dot ${apiStatus === 'Connected' ? 'status-active' : 'status-danger'}`} id="connection-status-dot"></div>
                    <span>API Status: {apiStatus}</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
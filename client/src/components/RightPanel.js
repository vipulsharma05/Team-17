// client/src/components/RightPanel.js

import React from 'react';
import { formatTime } from '../utils';
import axios from 'axios';

const RightPanel = ({ liveAlerts, onAlertClick }) => {
    
    const simulateNewAlert = async () => {
        // ... (existing simulateNewAlert logic remains the same)
    };

    return (
        <aside className="right-panel">
            <div className="panel-header">
                <h2 className="panel-title">Live Alerts</h2>
                <button className="btn btn-primary" onClick={simulateNewAlert} style={{ fontSize: '12px', padding: '5px 10px' }}>
                    + Simulate
                </button>
            </div>
            <div id="live-alerts">
                {liveAlerts.map(incident => (
                    // Add onClick handler here
                    <div key={incident.id} className="alert-item" onClick={() => onAlertClick(incident)}>
                        <div className={`alert-priority priority-${incident.priority.toLowerCase()}`}>
                            {incident.priority} PRIORITY
                        </div>
                        <div className="alert-content">{incident.description}</div>
                        <div className="alert-meta">
                            <span>📍 {incident.name}</span>
                            <span>⏰ {formatTime(incident.time)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default RightPanel;
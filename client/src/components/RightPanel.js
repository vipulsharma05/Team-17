import React from 'react';
import { formatTime } from '../utils';
import axios from 'axios';

const RightPanel = ({ liveAlerts }) => {

    const simulateNewAlert = async () => {
        const incidentData = {
            name: `Emergency ${Date.now()}`,
            coords: [19.0760 + (Math.random() - 0.5) * 0.1, 72.8777 + (Math.random() - 0.5) * 0.1],
            priority: ["HIGH", "MEDIUM", "LOW"][Math.floor(Math.random() * 3)],
            description: "Simulated emergency incident",
            source: 'simulation'
        };
        try {
            await axios.post('http://localhost:3001/api/incidents', incidentData);
        } catch (error) {
            console.error('Failed to create simulated incident:', error);
        }
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
                    <div key={incident.id} className="alert-item">
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
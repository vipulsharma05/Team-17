import React from 'react';
import axios from 'axios';
import { formatTime } from '../utils';

const Incidents = ({ incidents }) => {
    const resolveIncident = async (id) => {
        try {
            await axios.put(`http://localhost:3001/api/incidents/${id}`, { status: 'resolved' });
        } catch (error) {
            console.error('Failed to resolve incident:', error);
        }
    };

    return (
        <div className="content-panel active" id="incidents">
            <div className="panel-header">
                <h2 className="panel-title">Live Incident Management</h2>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>🔄 Refresh</button>
            </div>
            <div id="incidents-list">
                {incidents.map(incident => (
                    <div key={incident.id} className={`incident-item incident-${incident.priority.toLowerCase()}`}>
                        <h4>{incident.name} 
                            <span style={{ fontSize: '12px', background: incident.status === 'active' ? '#10b981' : incident.status === 'resolved' ? '#6b7280' : '#f59e0b', padding: '2px 6px', borderRadius: '3px', color: 'white', marginLeft: '10px' }}>
                                {incident.status.toUpperCase()}
                            </span>
                        </h4>
                        <p>{incident.description}</p>
                        <p><strong>Priority:</strong> {incident.priority} | <strong>Time:</strong> {formatTime(incident.time)}</p>
                        <p><strong>Location:</strong> {incident.coords[0].toFixed(4)}, {incident.coords[1].toFixed(4)}</p>
                        {incident.status === 'active' && (
                            <button className="btn btn-primary" onClick={() => resolveIncident(incident.id)} style={{ marginTop: '10px', fontSize: '12px', padding: '5px 10px' }}>
                                ✅ Mark Resolved
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Incidents;
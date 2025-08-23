import React from 'react';
import { formatTime } from '../utils';

const Dashboard = ({ incidents, shelters, resources, weather }) => {
    const activeIncidents = incidents.filter(i => i.status === "active");
    const highPriorityIncidents = activeIncidents.filter(i => i.priority === "HIGH");
    const totalPeopleInShelters = shelters.reduce((sum, s) => sum + s.current, 0);
    const floodedAreasCount = 2; 
    const safeZonesCount = 1; 

    return (
        <div className="content-panel active" id="dashboard">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{activeIncidents.length}</div>
                    <div className="stat-label">Active Incidents</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{highPriorityIncidents.length}</div>
                    <div className="stat-label">High Priority</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{shelters.length}</div>
                    <div className="stat-label">Active Shelters</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalPeopleInShelters}</div>
                    <div className="stat-label">People in Shelters</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{floodedAreasCount}</div>
                    <div className="stat-label">Flooded Areas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{safeZonesCount}</div>
                    <div className="stat-label">Safe Zones</div>
                </div>
            </div>
            
            <div className="weather-widget">
                <h3>Current Weather Conditions</h3>
                <div id="weather-info">
                    <p id="weather-details">
                        {weather.temperature ? `Temperature: ${weather.temperature}°C | Humidity: ${weather.humidity}% | Wind: ${weather.windSpeed} km/h | ${weather.condition}` : 'Loading weather data...'}
                    </p>
                    <p id="weather-alerts" style={{ color: weather.alerts?.length > 0 ? '#f59e0b' : '#10b981' }}>
                        {weather.alerts?.length > 0 ? `⚠️ ${weather.alerts.join(', ')}` : '✅ No active weather alerts'}
                    </p>
                </div>
            </div>

            <div className="incident-list">
                <h3>Recent Critical Incidents</h3>
                <div id="dashboard-incidents">
                    {highPriorityIncidents.slice(0, 3).map(incident => (
                        <div key={incident.id} className={`incident-item incident-${incident.priority.toLowerCase()}`}>
                            <h4>{incident.name}</h4>
                            <p>{incident.description}</p>
                            <small>Priority: {incident.priority} | {formatTime(incident.time)}</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
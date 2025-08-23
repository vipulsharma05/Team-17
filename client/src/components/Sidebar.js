import React from 'react';

const Sidebar = ({ activePanel, onPanelChange }) => {
    return (
        <nav className="sidebar">
            <div 
                className={`nav-item ${activePanel === 'dashboard' ? 'active' : ''}`} 
                onClick={() => onPanelChange('dashboard')}
            >
                <div className="nav-icon">📊</div>
                <span>Dashboard</span>
            </div>
            <div 
                className={`nav-item ${activePanel === 'map' ? 'active' : ''}`} 
                onClick={() => onPanelChange('map')}
            >
                <div className="nav-icon">🗺️</div>
                <span>Live Map</span>
            </div>
            <div 
                className={`nav-item ${activePanel === 'incidents' ? 'active' : ''}`} 
                onClick={() => onPanelChange('incidents')}
            >
                <div className="nav-icon">🚨</div>
                <span>Incidents</span>
            </div>
            <div 
                className={`nav-item ${activePanel === 'shelters' ? 'active' : ''}`} 
                onClick={() => onPanelChange('shelters')}
            >
                <div className="nav-icon">🏠</div>
                <span>Shelters</span>
            </div>
            <div 
                className={`nav-item ${activePanel === 'resources' ? 'active' : ''}`} 
                onClick={() => onPanelChange('resources')}
            >
                <div className="nav-icon">📦</div>
                <span>Resources</span>
            </div>
            <div 
                className={`nav-item ${activePanel === 'gps-tracker' ? 'active' : ''}`} 
                onClick={() => onPanelChange('gps-tracker')}
            >
                <div className="nav-icon">📍</div>
                <span>GPS Tracker</span>
            </div>
        </nav>
    );
};

export default Sidebar;
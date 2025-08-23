import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Dashboard from './components/Dashboard';
import LiveMap from './components/LiveMap';
import Incidents from './components/Incidents';
import Shelters from './components/Shelters';
import Resources from './components/Resources';
import GPSTracker from './components/GPSTracker';
import SocialMediaTriage from './components/SocialMediaTriage'; // NEW IMPORT
import './index.css';

const App = () => {
    const [incidents, setIncidents] = useState([]);
    const [shelters, setShelters] = useState([]);
    const [resources, setResources] = useState([]);
    const [weather, setWeather] = useState({});
    const [apiStatus, setApiStatus] = useState('Initializing...');
    const [activePanel, setActivePanel] = useState('dashboard');
    const [liveAlerts, setLiveAlerts] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);

    const fetchData = async () => {
        try {
            const [incidentsRes, sheltersRes, resourcesRes, weatherRes] = await Promise.all([
                axios.get('http://localhost:3001/api/incidents'),
                axios.get('http://localhost:3001/api/shelters'),
                axios.get('http://localhost:3001/api/resources'),
                axios.get('http://localhost:3001/api/weather')
            ]);
            setIncidents(incidentsRes.data);
            setShelters(sheltersRes.data);
            setResources(resourcesRes.data);
            setWeather(weatherRes.data);
            setApiStatus('Connected');
            
            const newAlerts = incidentsRes.data.filter(i => i.status === 'active');
            setLiveAlerts(newAlerts);

        } catch (error) {
            console.error('Failed to fetch data:', error);
            setApiStatus('Error');
        }
    };
    
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); 
        const ws = new WebSocket('ws://localhost:8080');
        ws.onmessage = () => fetchData(); 
        
        return () => {
            clearInterval(interval);
            ws.close();
        };
    }, []);

    const handlePanelChange = (panelId) => {
        setActivePanel(panelId);
    };
    
    const handleAlertClick = (incident) => {
        setActivePanel('map');
        setSelectedIncident(incident);
    };

    const renderPanel = () => {
        switch (activePanel) {
            case 'dashboard':
                return <Dashboard incidents={incidents} shelters={shelters} resources={resources} weather={weather} />;
            case 'map':
                return <LiveMap incidents={incidents} shelters={shelters} selectedIncident={selectedIncident} />;
            case 'incidents':
                return <Incidents incidents={incidents} />;
            case 'shelters':
                return <Shelters shelters={shelters} />;
            case 'resources':
                return <Resources resources={resources} />;
            case 'gps-tracker':
                return <GPSTracker />;
            case 'social-media':
                return <SocialMediaTriage />;
            default:
                return <Dashboard incidents={incidents} shelters={shelters} resources={resources} weather={weather} />;
        }
    };

    return (
        <div className="dashboard">
            <Header apiStatus={apiStatus} />
            <Sidebar activePanel={activePanel} onPanelChange={handlePanelChange} />
            <main className="main-content">
                {renderPanel()}
            </main>
            <RightPanel liveAlerts={liveAlerts} onAlertClick={handleAlertClick} />
        </div>
    );
};

export default App;
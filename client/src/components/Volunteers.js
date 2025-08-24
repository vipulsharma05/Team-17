import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Dashboard from './components/Dashboard';
import LiveMap from './components/LiveMap';
import Incidents from './components/Incidents';
import Shelters from './components/Shelters';
import Resources from './components/Resources';
import GPSTracker from './components/GPSTracker';
import SocialMediaTriage from './components/SocialMediaTriage';
import Volunteers from './components/Volunteers';

import './index.css';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const App = () => {
    const [incidents, setIncidents] = useState([]);
    const [shelters, setShelters] = useState([]);
    const [resources, setResources] = useState([]);
    const [weather, setWeather] = useState({});
    const [apiStatus, setApiStatus] = useState('Initializing...');
    const [activePanel, setActivePanel] = useState('dashboard');
    const [liveAlerts, setLiveAlerts] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [user, setUser] = useState(null);

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
        
        // Firebase Authentication
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                signInAnonymously(auth);
            }
        });
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:8080');
        ws.onmessage = () => fetchData(); 
        
        return () => {
            clearInterval(interval);
            ws.close();
            unsubscribeAuth();
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
            case 'volunteers': // New case
                return <Volunteers user={user} db={db} />;
            default:
                return <Dashboard incidents={incidents} shelters={shelters} resources={resources} weather={weather} />;
        }
    };

    return (
        <div className="dashboard">
            <Header apiStatus={apiStatus} user={user} />
            <Sidebar activePanel={activePanel} onPanelChange={handlePanelChange} />
            <main className="main-content">
                {renderPanel()}
            </main>
            <RightPanel liveAlerts={liveAlerts} onAlertClick={handleAlertClick} />
        </div>
    );
};

export default App;

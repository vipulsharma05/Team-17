import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GPSTracker = () => {
    const [location, setLocation] = useState('Getting location...');
    const [currentCoords, setCurrentCoords] = useState(null);

    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setCurrentCoords({ lat: latitude, lng: longitude });
                    setLocation(
                        <div>
                            <strong>Latitude:</strong> {latitude.toFixed(6)}<br/>
                            <strong>Longitude:</strong> {longitude.toFixed(6)}<br/>
                            <strong>Accuracy:</strong> ±{accuracy}m<br/>
                            <strong>Updated:</strong> {new Date().toLocaleTimeString()}
                        </div>
                    );
                },
                (error) => {
                    setLocation('Failed to get location: ' + error.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            setLocation('Geolocation not supported by this browser');
        }
    };

    useEffect(() => {
        updateLocation();
    }, []);

    const reportIncident = async (e) => {
        e.preventDefault();
        if (!currentCoords) {
            alert('Location not available. Please enable GPS.');
            return;
        }

        const formData = {
            name: e.target['gps-incident-type'].value + ' Emergency',
            coords: [currentCoords.lat, currentCoords.lng],
            priority: e.target['gps-incident-priority'].value,
            description: e.target['gps-incident-description'].value,
            source: 'gps_report'
        };

        try {
            await axios.post('http://localhost:3001/api/incidents', formData);
            alert('Incident reported successfully!');
            e.target.reset();
        } catch (error) {
            alert('Failed to report incident.');
            console.error('Failed to report incident:', error);
        }
    };

    return (
        <div className="content-panel active" id="gps">
            <div className="form-container">
                <h2>GPS Location Services</h2>
                <div className="gps-form">
                    <h3>Current Location</h3>
                    <p id="current-location">{location}</p>
                    <button className="btn btn-primary" onClick={updateLocation}>📍 Update Location</button>
                </div>
                <div className="gps-form">
                    <h3>Report Incident at Current Location</h3>
                    <form id="gps-incident-form" onSubmit={reportIncident}>
                        <div className="form-group">
                            <label className="form-label">Incident Type</label>
                            <select className="form-select" id="gps-incident-type">
                                <option value="flood">Flooding</option>
                                <option value="fire">Fire</option>
                                <option value="medical">Medical Emergency</option>
                                <option value="accident">Accident</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-select" id="gps-incident-priority">
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" id="gps-incident-description" placeholder="Describe the incident..."></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary">🚨 Report Incident</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GPSTracker;
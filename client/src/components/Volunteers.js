import React, { useState, useEffect } from 'react';
import Chat from './Chat';
import axios from 'axios';

const Volunteers = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user] = useState({ uid: 'DDMA-Admin', name: 'DDMA Admin' });

    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3001/api/volunteers');
                setVolunteers(response.data);
                if (response.data.length > 0) {
                    setSelectedVolunteer(response.data[0]);
                }
                setError(null);
            } catch (error) {
                console.error('Failed to fetch volunteers:', error);
                setError('Failed to load volunteers. Please check your server connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchVolunteers();
    }, []);

    const handleSelectVolunteer = (volunteer) => {
        setSelectedVolunteer(volunteer);
    };

    if (loading) {
        return (
            <div className="content-panel active" id="volunteers" style={{ padding: '20px' }}>
                <div>Loading volunteers...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content-panel active" id="volunteers" style={{ padding: '20px' }}>
                <div style={{ color: '#ef4444' }}>{error}</div>
            </div>
        );
    }

    return (
        <div className="content-panel active" id="volunteers" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
            <div className="sidebar" style={{ 
                width: '250px', 
                borderRight: '1px solid #475569', 
                overflowY: 'auto',
                padding: '10px',
                background: '#1e293b'
            }}>
                <h3 className="panel-header" style={{ 
                    margin: '0 0 20px 0', 
                    padding: '10px 0', 
                    borderBottom: '1px solid #475569',
                    color: 'white'
                }}>
                    Online Volunteers ({volunteers.length})
                </h3>
                {volunteers.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>
                        No volunteers online
                    </div>
                ) : (
                    volunteers.map(volunteer => (
                        <div 
                            key={volunteer.id}
                            className={`nav-item ${selectedVolunteer?.id === volunteer.id ? 'active' : ''}`}
                            onClick={() => handleSelectVolunteer(volunteer)}
                            style={{
                                padding: '12px',
                                margin: '5px 0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: selectedVolunteer?.id === volunteer.id ? '#3b82f6' : '#334155',
                                color: 'white',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedVolunteer?.id !== volunteer.id) {
                                    e.target.style.background = '#475569';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedVolunteer?.id !== volunteer.id) {
                                    e.target.style.background = '#334155';
                                }
                            }}
                        >
                            <span>{volunteer.name}</span>
                            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                                Online
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div style={{ 
                flexGrow: 1, 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column',
                background: '#0f172a',
                color: 'white'
            }}>
                {selectedVolunteer && user ? (
                    <Chat chatId={selectedVolunteer.id} user={user} />
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        color: '#64748b', 
                        marginTop: '50px',
                        fontSize: '16px'
                    }}>
                        {volunteers.length > 0 ? 
                            'Select a volunteer to start a chat' : 
                            'No volunteers available to chat with'
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default Volunteers;
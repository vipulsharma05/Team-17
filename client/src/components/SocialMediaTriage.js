import React, { useState } from 'react';
import axios from 'axios';

const SocialMediaTriage = () => {
    const [postText, setPostText] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Classifying post...');
        try {
            await axios.post('http://localhost:3001/api/triage-social-media', { postText });
            setStatus('Post successfully triaged and sent to dashboard!');
            setPostText('');
        } catch (error) {
            setStatus('Error: Failed to triage post.');
            console.error(error);
        }
    };

    return (
        <div className="content-panel active" id="social-media">
            <div className="form-container">
                <h2>AI-Powered Social Media Triage</h2>
                <p>Simulate a social media post to see how the AI prioritizes alerts.</p>
                <div className="gps-form" style={{ marginTop: '20px' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Social Media Post Text</label>
                            <textarea 
                                className="form-textarea" 
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                placeholder="e.g., 'We are trapped on a roof, please send rescue boats now!'"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Classify & Report</button>
                    </form>
                    {status && <p style={{ marginTop: '10px', color: '#60a5fa' }}>{status}</p>}
                </div>
            </div>
        </div>
    );
};

export default SocialMediaTriage;
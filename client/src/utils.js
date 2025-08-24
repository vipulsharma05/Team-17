// client/src/utils.js

import { format, parseISO } from 'date-fns';

export function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
}

export function formatDate(dateString) {
    try {
        const date = parseISO(dateString);
        return format(date, 'd MMM yyyy, hh:mm a');
    } catch (error) {
        return 'Invalid Date';
    }
}
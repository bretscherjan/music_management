import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/lib/api';

/**
 * Fires a non-blocking page-view event to the backend analytics endpoint.
 * Safe to call on every route change; duplicate rapid fires are debounced.
 */
export function usePageTracking() {
    const location = useLocation();
    const lastPath = useRef<string>('');

    useEffect(() => {
        const path = location.pathname;
        if (path === lastPath.current) return;
        lastPath.current = path;

        // Fire and forget – do not await, do not block rendering
        api.post('/analytics/pageview', {
            path,
            referrer: document.referrer || null,
        }).catch(() => {
            // Silently ignore tracking failures
        });
    }, [location.pathname]);
}

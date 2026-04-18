import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    type ReactNode,
} from 'react';
import notificationService, {
    type UnreadCounts,
    type ReadCategory,
} from '@/services/notificationService';
import chatService from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';

export type MarkAsReadContentType = ReadCategory | 'CHAT';

interface LastCheckedAt {
    events: string | null;
    news: string | null;
    polls: string | null;
}

interface UnreadContextType {
    unreadCounts: UnreadCounts;
    lastCheckedAt: LastCheckedAt;
    /** Mark a category (EVENTS/NEWS/POLLS) as read — optimistic + backend */
    markRead: (category: ReadCategory) => void;
    /** Mark a specific chat as read — optimistic decrement + backend */
    markChatRead: (chatId: number) => void;
    refresh: () => void;
    isLoading: boolean;
}

const defaultCounts: UnreadCounts = { chat: 0, events: 0, news: 0, polls: 0 };
const defaultLastChecked: LastCheckedAt = { events: null, news: null, polls: null };

const UnreadContext = createContext<UnreadContextType>({
    unreadCounts: defaultCounts,
    lastCheckedAt: defaultLastChecked,
    markRead: () => {},
    markChatRead: () => {},
    refresh: () => {},
    isLoading: true,
});

const POLL_INTERVAL_MS = 60_000;

export function UnreadProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [counts, setCounts] = useState<UnreadCounts>(defaultCounts);
    const [lastCheckedAt, setLastCheckedAt] = useState<LastCheckedAt>(defaultLastChecked);
    const [isLoading, setIsLoading] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchCounts = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const data = await notificationService.getUnreadCounts();
            setCounts(data.counts);
            setLastCheckedAt(data.lastCheckedAt);
        } catch {
            // Silently ignore background errors
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            setCounts(defaultCounts);
            setLastCheckedAt(defaultLastChecked);
            setIsLoading(false);
            return;
        }
        fetchCounts();
        intervalRef.current = setInterval(fetchCounts, POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthenticated, fetchCounts]);

    useEffect(() => {
        const onFocus = () => { if (isAuthenticated) fetchCounts(); };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [isAuthenticated, fetchCounts]);

    /** Marks a whole category (EVENTS/NEWS/POLLS) read — instant optimistic update */
    const markRead = useCallback((category: ReadCategory) => {
        const key = category.toLowerCase() as keyof UnreadCounts;
        setCounts(prev => ({ ...prev, [key]: 0 }));
        const now = new Date().toISOString();
        setLastCheckedAt(prev => ({ ...prev, [key]: now }));
        notificationService.markCategoryRead(category).catch(() => {});
    }, []);

    /**
     * Marks a single chat as read.
     * Optimistically decrements the global chat count by 1 (min 0),
     * fires the per-chat API, then re-fetches for accuracy.
     */
    const markChatRead = useCallback((chatId: number) => {
        setCounts(prev => ({ ...prev, chat: Math.max(0, prev.chat - 1) }));
        chatService.markAsRead(chatId)
            .then(() => fetchCounts())
            .catch(() => fetchCounts()); // always re-sync even on error
    }, [fetchCounts]);

    const refresh = useCallback(() => { fetchCounts(); }, [fetchCounts]);

    return (
        <UnreadContext.Provider
            value={{ unreadCounts: counts, lastCheckedAt, markRead, markChatRead, refresh, isLoading }}
        >
            {children}
        </UnreadContext.Provider>
    );
}

export function useUnread() {
    return useContext(UnreadContext);
}

/**
 * Unified hook: call on mount of any content page to mark it as read.
 *
 * - contentType EVENTS | NEWS | POLLS: marks the whole category read.
 * - contentType CHAT: marks the specific chat (contentId) read.
 *   contentId is required when contentType is 'CHAT'.
 */
export function useMarkAsRead(contentType: MarkAsReadContentType, contentId?: number) {
    const { markRead, markChatRead } = useUnread();
    useEffect(() => {
        if (contentType === 'CHAT') {
            if (contentId) markChatRead(contentId);
        } else {
            markRead(contentType as ReadCategory);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentType, contentId]);
}

/** @deprecated Use useMarkAsRead instead */
export function useMarkRead(category: ReadCategory) {
    return useMarkAsRead(category);
}

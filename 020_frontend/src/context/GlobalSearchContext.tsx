import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface GlobalSearchContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    return (
        <GlobalSearchContext.Provider value={{ isOpen, open, close }}>
            {children}
        </GlobalSearchContext.Provider>
    );
}

export function useGlobalSearch(): GlobalSearchContextType {
    const ctx = useContext(GlobalSearchContext);
    if (!ctx) throw new Error('useGlobalSearch must be used inside GlobalSearchProvider');
    return ctx;
}

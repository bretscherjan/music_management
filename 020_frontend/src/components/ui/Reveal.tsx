import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'left' | 'right' | 'none';
}

export function Reveal({ children, className, delay = 0, direction = 'up' }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.08 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const initial =
        direction === 'up' ? 'translateY(28px)' :
        direction === 'left' ? 'translateX(-28px)' :
        direction === 'right' ? 'translateX(28px)' : 'none';

    return (
        <div
            ref={ref}
            className={cn('transition-all duration-700 ease-out', className)}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translate(0)' : initial,
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

import { Link, useLocation } from 'react-router-dom';
import {
    Calendar,
    Users,
    FileText,
    Home,
    Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Home', href: '/member', icon: Home },
    { label: 'Termine', href: '/member/events', icon: Calendar },
    { label: 'Dateien', href: '/member/files', icon: FileText },
    { label: 'Mappen', href: '/member/music-folders', icon: Folder },
    { label: 'Mitglieder', href: '/member/members', icon: Users },
];

export function MobileBottomNav() {
    const location = useLocation();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || (item.href !== '/member' && location.pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                                isActive
                                    ? "text-[hsl(var(--musig-primary))]"
                                    : "text-gray-500"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default MobileBottomNav;

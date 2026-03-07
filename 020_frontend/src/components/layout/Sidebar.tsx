import { Link, useLocation } from 'react-router-dom';
import { useAuth, useIsAdmin } from '@/context/AuthContext';
import {
    Calendar,
    Users,
    FileText,
    Music,
    Newspaper,
    Library,
    BarChart,
    Folder,
    ClipboardList,
    Activity,
    ScrollText,
    Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
    { label: 'Termine', href: '/member/events', icon: <Calendar className="h-5 w-5" /> },
    { label: 'Dateien', href: '/member/files', icon: <FileText className="h-5 w-5" /> },
    { label: 'Mappen', href: '/member/music-folders', icon: <Folder className="h-5 w-5" /> },
    { label: 'Mitglieder', href: '/member/members', icon: <Users className="h-5 w-5" /> },
    { label: 'Toolkit', href: '/member/toolkit', icon: <Wrench className="h-5 w-5" /> },
];

const adminNavItems: NavItem[] = [
    { label: 'Termine verwalten', href: '/member/admin/events', icon: <Calendar className="h-5 w-5" />, adminOnly: true },
    { label: 'Workspace', href: '/member/admin/workspace', icon: <Folder className="h-5 w-5" />, adminOnly: true },
    { label: 'Notenverwaltung', href: '/member/admin/sheet-music', icon: <Library className="h-5 w-5" />, adminOnly: true },
    { label: 'Register', href: '/member/admin/registers', icon: <Music className="h-5 w-5" />, adminOnly: true },
    { label: 'News', href: '/member/admin/news', icon: <Newspaper className="h-5 w-5" />, adminOnly: true },
    { label: 'Statistiken', href: '/member/admin/statistics', icon: <BarChart className="h-5 w-5" />, adminOnly: true },
    { label: 'Engagement', href: '/member/admin/engagement', icon: <Activity className="h-5 w-5" />, adminOnly: true },
    { label: 'Protokoll', href: '/member/admin/protokoll', icon: <ClipboardList className="h-5 w-5" />, adminOnly: true },
    { label: 'Logs', href: '/member/admin/logs', icon: <ScrollText className="h-5 w-5" />, adminOnly: true },
];

export function Sidebar() {
    const { user } = useAuth();
    const isAdmin = useIsAdmin();
    const location = useLocation();

    return (
        <aside className="hidden md:flex flex-col w-[100px] bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 shrink-0 z-30">

            {/* Profile Section (Top) */}
            <Link
                to="/member/settings"
                className="pt-4 pb-2 flex flex-col items-center justify-center border-b border-gray-100 mx-4 mb-2 hover:bg-gray-50 transition-colors rounded-b-lg"
            >
                <div className="h-9 w-9 rounded-full bg-[#BDD18C] flex items-center justify-center text-[#405116] font-bold text-sm shadow-sm mb-1">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <span className="text-[10px] text-gray-500 font-medium truncate max-w-full">
                    Einstellungen
                </span>
            </Link>

            <div className="px-2 py-1 flex-1 flex flex-col gap-1 overflow-hidden hover:overflow-y-auto custom-scrollbar">

                {/* Main Navigation */}
                <nav className="flex flex-col gap-1">
                    {mainNavItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-[#BDD18C] text-[#405116] shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                )}
                            >
                                <div className={cn(
                                    "p-0.5 rounded-full transition-colors",
                                )}>
                                    <div className="!h-5 !w-5 [&>svg]:h-5 [&>svg]:w-5">
                                        {item.icon}
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium tracking-wide text-center leading-none">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Separator */}
                {isAdmin && (
                    <div className="mx-4 my-1 border-t border-gray-100" />
                )}

                {/* Administration */}
                {isAdmin && (
                    <nav className="flex flex-col gap-1">
                        {adminNavItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-[#BDD18C] text-[#405116] shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                    )}
                                >
                                    <div className="!h-5 !w-5 [&>svg]:h-5 [&>svg]:w-5">
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-medium tracking-wide text-center leading-none">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>

            {/* Bottom spacer if needed, or remove completely */}
        </aside>
    );
}

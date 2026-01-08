import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Music,
    Users,
    CheckSquare,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../helpers/authStore';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Anlässe', path: '/events-member' },
    { icon: Music, label: 'Notenbibliothek', path: '/library' },
    { icon: CheckSquare, label: 'Aufgaben', path: '/tasks' },
    { icon: Users, label: 'Mitglieder', path: '/members', adminOnly: true },
    { icon: Settings, label: 'Einstellungen', path: '/settings' },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const filteredNavItems = navItems.filter(item => {
        if (item.adminOnly && user?.role !== 'Admin') return false;
        return true;
    });

    return (
        <aside
            className={`
        fixed left-0 top-0 h-screen bg-white border-r border-neutral-200
        transition-all duration-300 ease-in-out z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold text-lg">ME</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-primary-800 leading-tight">Musig Elgg</h1>
                            <p className="text-xs text-neutral-500">Vereinsverwaltung</p>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-10 h-10 mx-auto rounded-lg gradient-primary flex items-center justify-center">
                        <span className="text-white font-bold text-lg">ME</span>
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 w-6 h-6 bg-primary-800 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto">
                <ul className="space-y-1 px-3">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                    ${isActive
                                            ? 'bg-primary-800 text-white shadow-elegant'
                                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary-800'
                                        }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon size={20} className="flex-shrink-0" />
                                    {!isCollapsed && (
                                        <span className="font-medium">{item.label}</span>
                                    )}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 bg-neutral-50 p-4">
                {!isCollapsed ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-500 flex items-center justify-center text-white font-medium">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-neutral-500 hover:text-primary-800 hover:bg-neutral-200 rounded-lg transition-colors"
                            title="Abmelden"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={logout}
                        className="w-full p-2 text-neutral-500 hover:text-primary-800 hover:bg-neutral-200 rounded-lg transition-colors flex justify-center"
                        title="Abmelden"
                    >
                        <LogOut size={20} />
                    </button>
                )}
            </div>
        </aside>
    );
}

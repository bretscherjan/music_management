import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../helpers/authStore';

interface HeaderProps {
    title: string;
    onMenuClick: () => void;
    isSidebarCollapsed: boolean;
}

export function Header({ title, onMenuClick, isSidebarCollapsed }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header
            className={`
        fixed top-0 right-0 h-16 bg-white border-b border-neutral-200 z-30
        flex items-center justify-between px-6 transition-all duration-300
        ${isSidebarCollapsed ? 'left-20' : 'left-64'}
      `}
        >
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-primary-800">{title}</h1>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
                    <Search size={18} className="text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Suchen..."
                        className="bg-transparent border-none outline-none text-sm w-48 placeholder-neutral-500"
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-800 rounded-full"></span>
                </button>

                {/* User Avatar (Mobile) */}
                <div className="lg:hidden w-9 h-9 rounded-full bg-secondary-500 flex items-center justify-center text-white font-medium text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            </div>
        </header>
    );
}

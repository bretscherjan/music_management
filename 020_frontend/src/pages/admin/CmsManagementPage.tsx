import { useState } from 'react';
import { LayoutDashboard, Users, Image as ImageIcon, FileText } from 'lucide-react';
import { SponsorManager } from '@/components/admin/cms/SponsorManager';
import { GalleryManager } from '../../components/admin/cms/GalleryManager';
import { FlyerManager } from '../../components/admin/cms/FlyerManager';
import { cn } from '@/lib/utils';

export function CmsManagementPage() {
    const [activeTab, setActiveTab] = useState('sponsors');

    const tabs = [
        { id: 'sponsors', label: 'Sponsoren', icon: Users },
        { id: 'gallery', label: 'Galerie', icon: ImageIcon },
        { id: 'flyers', label: 'Flyer', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                        CMS Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Verwalte die Inhalte der öffentlichen Website.
                    </p>
                </div>
            </div>

            {/* Segmented control */}
            <div className="segmented-control max-w-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn('segmented-control-option flex items-center gap-1.5', activeTab === tab.id && 'is-active')}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'sponsors' && <SponsorManager />}
            {activeTab === 'gallery' && <GalleryManager />}
            {activeTab === 'flyers' && <FlyerManager />}
        </div>
    );
}

export default CmsManagementPage;

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Users, Image as ImageIcon, FileText } from 'lucide-react';
import { SponsorManager } from '@/components/admin/cms/SponsorManager';
import { CarouselManager } from '../../components/admin/cms/CarouselManager';
import { GalleryManager } from '../../components/admin/cms/GalleryManager';
import { FlyerManager } from '../../components/admin/cms/FlyerManager';

export function CmsManagementPage() {
    const [activeTab, setActiveTab] = useState('sponsors');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="h-8 w-8" />
                        CMS Management
                    </h1>
                    <p className="text-muted-foreground">
                        Verwalte die Inhalte der öffentlichen Website wie Sponsoren, Bilder und Flyer.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto bg-transparent p-0">
                    <TabsTrigger
                        value="sponsors"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Sponsoren
                    </TabsTrigger>
                    <TabsTrigger
                        value="carousel"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Karussell
                    </TabsTrigger>
                    <TabsTrigger
                        value="gallery"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Galerie
                    </TabsTrigger>
                    <TabsTrigger
                        value="flyers"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input h-10"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Flyer
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sponsors" className="border-none p-0 outline-none">
                    <SponsorManager />
                </TabsContent>
                <TabsContent value="carousel" className="border-none p-0 outline-none">
                    <CarouselManager />
                </TabsContent>
                <TabsContent value="gallery" className="border-none p-0 outline-none">
                    <GalleryManager />
                </TabsContent>
                <TabsContent value="flyers" className="border-none p-0 outline-none">
                    <FlyerManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default CmsManagementPage;

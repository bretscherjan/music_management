import { Download, ExternalLink, Smartphone } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

const apkUrl = '/downloads/musig-elgg-admin.apk';

export function AppDownloadPage() {
    return (
        <div className="bg-background">
            <section className="relative overflow-hidden border-b border-border/40 bg-background py-20 md:py-28">
                <div className="absolute left-[-6rem] top-10 h-64 w-64 rounded-full bg-brand-primary/8 blur-3xl" />
                <div className="absolute bottom-[-4rem] right-[-3rem] h-72 w-72 rounded-full bg-brand-yellow/12 blur-3xl" />

                <div className="container-app relative z-10 px-4">
                    <Reveal className="mx-auto max-w-4xl text-center">
                        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-brand-primary/15 bg-white/70 px-5 py-2 text-sm font-semibold text-brand-primary shadow-sm backdrop-blur">
                            <Smartphone className="h-4 w-4" />
                            Android-Download
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl">
                            Musig Elgg Admin App
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                            Lade die aktuelle Android-APK direkt herunter und installiere die Vereins-App manuell auf deinem Gerät.
                        </p>
                    </Reveal>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container-app px-4">
                    <div className="grid gap-8">
                        <Reveal>
                            <div className="relative overflow-hidden rounded-[2rem] border border-border/30 bg-card p-8 shadow-xl md:p-10">
                                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-primary/10 blur-3xl" />
                                <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                                    Direktdownload der aktuellen APK
                                </h2>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                                    Die Datei wird bei jedem Server-Deployment automatisch neu erstellt und unter derselben Adresse aktualisiert bereitgestellt.
                                </p>

                                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                                    <a
                                        href={apkUrl}
                                        download="musig-elgg-admin.apk"
                                        className="inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-primary px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-primary/90 hover:shadow-xl"
                                    >
                                        <Download className="h-5 w-5" />
                                        APK herunterladen
                                    </a>
                                    <a
                                        href={apkUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-3 rounded-2xl border border-foreground/10 bg-background px-6 py-4 text-base font-semibold text-foreground transition-colors hover:bg-foreground/5"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                        Download-Link öffnen
                                    </a>
                                </div>

                                <div className="mt-10 grid gap-4">
                                    <InfoCard
                                        title="Android-Only"
                                        text="Diese App ist vorerst nur für Android verfügbar."
                                    />
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>
        </div>
    );
}

interface InfoCardProps {
    title: string;
    text: string;
}

function InfoCard({ title, text }: InfoCardProps) {
    return (
        <div className="rounded-[1.5rem] border border-border/40 bg-background p-5 shadow-sm">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
    );
}
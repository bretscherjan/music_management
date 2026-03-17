import { Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export function ContactPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

    const safeTextRegex = /^[a-zA-Z0-9\säöüÄÖÜéàèÉÀÈ(),.!?;:\-_]*$/;

    const validateField = (name: string, value: string) => {
        if (name === 'email') return ''; // Email has its own validation in browser/backend
        if (!safeTextRegex.test(value)) {
            return 'Nur Buchstaben, Zahlen und (),.!?;:-_ erlaubt';
        }
        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation before submit
        const newErrors: Record<string, string> = {
            name: validateField('name', formData.name),
            subject: validateField('subject', formData.subject),
            message: validateField('message', formData.message),
        };

        if (Object.values(newErrors).some(err => err !== '')) {
            setErrors(newErrors);
            return;
        }

        setStatus('loading');
        setRateLimitMessage(null);

        try {
            await api.post('/contact', formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setErrors({});
        } catch (error: any) {
            console.error('Error sending message:', error);
            if (error.response?.status === 429) {
                setRateLimitMessage(error.response.data.message || 'Zu viele Anfragen. Bitte versuche es später erneut.');
                setStatus('idle');
            } else {
                setStatus('error');
            }
        }
    };
    return (
        <div className="bg-background min-h-screen">
            {/* Hero Section */}
            <section className="py-20 md:py-32 bg-background border-b border-border/50">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8 tracking-tighter text-foreground">
                            Kontakt
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Hast du noch Fragen oder möchtest du uns kennenlernen? Wir freuen uns auf deine Nachricht!
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-24 bg-card">
                <div className="container-app">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20">
                        {/* Contact Information */}
                        <div className="px-4 lg:px-0">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center lg:text-left">
                                Kontaktinformationen
                            </h2>

                            <div className="space-y-10">
                                <ContactItem
                                    icon={<Mail className="h-6 w-6" />}
                                    title="E-Mail Adresse"
                                    content="info@musig-elgg.ch"
                                    link="mailto:info@musig-elgg.ch"
                                />

                                <ContactItem
                                    icon={<Clock className="h-6 w-6" />}
                                    title="Probenzeiten & Ort"
                                    content="Jeden 2. Montag, 20:00 Uhr"
                                    subtitle="Primarschule 'Im See', 8353 Elgg. Schnupperproben sind mit vorangegangener Anmeldung möglich."
                                />

                            </div>

                            {/* Map */}
                            <div className="mt-16 bg-background rounded-[2.5rem] border border-border/10 p-4 shadow-xl overflow-hidden group h-[350px] relative">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d697.3061700364333!2d8.867176345141536!3d47.49589626201634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479a96abf445a797%3A0x26bc98540a0ccac1!2sSeegartenstrasse%2021%2C%208353%20Elgg!5e1!3m2!1sde!2sch!4v1768857013028!5m2!1sde!2sch"
                                    className="w-full h-full rounded-[2rem] border-none contrast-[1.1] transition-all duration-700"
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="px-4 lg:px-0">
                            <div className="bg-background rounded-[3rem] border border-border/20 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                {status === 'success' ? (
                                    <div className="py-12 text-center">
                                        <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-foreground mb-4">Nachricht gesendet!</h3>
                                        <p className="text-lg text-muted-foreground mb-10 max-w-sm mx-auto">
                                            Vielen Dank. Wir haben deine Nachricht erhalten.
                                        </p>
                                        <button
                                            onClick={() => setStatus('idle')}
                                            className="px-8 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg active:scale-95"
                                        >
                                            Neue Nachricht senden
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-foreground mb-10 text-center lg:text-left">Nachricht senden</h2>
                                        <form onSubmit={handleSubmit} className="space-y-8">
                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label htmlFor="name" className="text-sm font-bold text-foreground/70 ml-1">Name</label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        required
                                                        value={formData.name}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData({ ...formData, name: val });
                                                            setErrors({ ...errors, name: validateField('name', val) });
                                                        }}
                                                        className={`w-full px-6 py-4 rounded-2xl bg-muted/30 border-2 outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background ${errors.name ? 'border-red-500' : 'border-transparent focus:border-brand-primary'}`}
                                                        placeholder="Name"
                                                    />
                                                    {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="email" className="text-sm font-bold text-foreground/70 ml-1">E-Mail</label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full px-6 py-4 rounded-2xl bg-muted/30 border-2 border-transparent outline-none transition-all focus:border-brand-primary focus:bg-background placeholder:text-muted-foreground/50"
                                                        placeholder="E-Mail"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="subject" className="text-sm font-bold text-foreground/70 ml-1">Betreff</label>
                                                <input
                                                    type="text"
                                                    id="subject"
                                                    required
                                                    value={formData.subject}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData({ ...formData, subject: val });
                                                        setErrors({ ...errors, subject: validateField('subject', val) });
                                                    }}
                                                    className={`w-full px-6 py-4 rounded-2xl bg-muted/30 border-2 outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background ${errors.subject ? 'border-red-500' : 'border-transparent focus:border-brand-primary'}`}
                                                    placeholder="Worum geht es?"
                                                    list="subject-suggestions"
                                                />
                                                <p className="text-sm text-muted-foreground/70 ml-1">Wählen Sie einen Vorschlag oder geben Sie einen eigenen Betreff ein.</p>
                                                <datalist id="subject-suggestions">
                                                    <option value="Schnupperprobe" />
                                                    <option value="Auftrittsanfrage" />
                                                    <option value="Passivmitgliedschaft" />
                                                    <option value="Sponsoring" />
                                                </datalist>
                                                {errors.subject && <p className="text-red-500 text-xs mt-1 ml-1">{errors.subject}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="message" className="text-sm font-bold text-foreground/70 ml-1">Nachricht</label>
                                                <textarea
                                                    id="message"
                                                    rows={5}
                                                    required
                                                    minLength={10}
                                                    value={formData.message}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData({ ...formData, message: val });
                                                        setErrors({ ...errors, message: validateField('message', val) });
                                                    }}
                                                    className={`w-full px-6 py-4 rounded-2xl bg-muted/30 border-2 outline-none transition-all resize-none placeholder:text-muted-foreground/50 focus:bg-background ${errors.message ? 'border-red-500' : 'border-transparent focus:border-brand-primary'}`}
                                                    placeholder="Deine Nachricht an uns..."
                                                />
                                                {errors.message && <p className="text-red-500 text-xs mt-1 ml-1">{errors.message}</p>}
                                            </div>

                                            {rateLimitMessage && (
                                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-sm">
                                                    {rateLimitMessage}
                                                </div>
                                            )}

                                            {status === 'error' && (
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-medium">
                                                    Hoppla! Ein Fehler ist aufgetreten. Bitte versuch es später noch einmal.
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={status === 'loading'}
                                                className="w-full bg-brand-primary text-white py-5 rounded-[1.25rem] hover:bg-brand-primary/90 transition-all font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                            >
                                                {status === 'loading' ? (
                                                    <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="h-5 w-5" />
                                                        Nachricht senden
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 bg-background">
                <div className="container-app">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                            Schnupperprobe gewünscht?
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                            Möchtest du uns persönlich kennenlernen? Komm doch einfach bei einer unserer Proben vorbei – jeden 2. Montag um 20:00 Uhr. Wir wären froh um eine kurze Anmeldung!
                        </p>
                        <div className="bg-card rounded-[2.5rem] p-10 border border-border/10 inline-flex flex-col sm:flex-row items-center gap-8 shadow-sm">
                            <div className="flex items-center gap-4 text-left">
                                <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <Clock className="h-7 w-7" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-muted-foreground uppercase">Ungerade Kalenderwochen</div>
                                    <div className="text-xl font-black text-foreground">Jeden 2. Montag, 20:00</div>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-border/20 hidden sm:block"></div>
                            <Link to="/events" className="text-brand-primary font-bold hover:underline py-2">
                                Alle Termine ansehen →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

interface ContactItemProps {
    icon: React.ReactNode;
    title: string;
    content: string;
    subtitle?: string;
    link?: string;
}

function ContactItem({ icon, title, content, subtitle, link }: ContactItemProps) {
    const ContentWrapper = link ? 'a' : 'div';
    const wrapperProps = link ? { href: link, className: 'hover:text-brand-primary transition-colors' } : {};

    return (
        <div className="flex items-start gap-6 group">
            <div className="bg-background group-hover:bg-brand-primary/10 transition-colors w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border border-border/10 shadow-sm text-brand-primary group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</div>
                <ContentWrapper {...wrapperProps} className={`text-xl font-bold text-foreground leading-tight ${link ? 'hover:text-brand-primary transition-colors' : ''}`}>
                    {content}
                </ContentWrapper>
                {subtitle && (
                    <div className="text-base text-muted-foreground/80 mt-2 leading-relaxed max-w-md">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}

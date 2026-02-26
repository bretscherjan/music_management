import { Mail, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
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
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[hsl(var(--musig-primary))] to-[hsl(var(--musig-primary))]/80 text-white py-20">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-5xl font-bold mb-6">Kontakt</h1>
                        <p className="text-xl text-white/90 leading-relaxed">
                            Hast du noch Fragen oder möchtest du uns kennenlernen? Wir freuen uns auf deine Nachricht!
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-16">
                <div className="container-app">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div>
                            <h2 className="text-3xl font-bold text-[hsl(var(--musig-primary))] mb-8">
                                Kontaktinformationen
                            </h2>

                            <div className="space-y-6">
                                <ContactItem
                                    icon={<Mail className="h-6 w-6" />}
                                    title="E-Mail"
                                    content="info@musig-elgg.ch"
                                    link="mailto:info@musig-elgg.ch"
                                />

                                {/*
                                <ContactItem
                                    icon={<Phone className="h-6 w-6" />}
                                    title="Telefon"
                                    content="+41 52 XXX XX XX"
                                    link="tel:+41521234567"
                                />
                                <ContactItem
                                    icon={<MapPin className="h-6 w-6" />}
                                    title="Adresse"
                                    content="Florahof 9"
                                    subtitle="8353 Elgg, Schweiz"
                                />
                                */}

                                <ContactItem
                                    icon={<Clock className="h-6 w-6" />}
                                    title="Probenzeiten"
                                    content="jeden 2. Montag, 20:00 Uhr"
                                    subtitle="Schnupperproben sind mit vorangegangener Anmeldung möglich."
                                />
                            </div>

                            {/* Map Placeholder */}
                            <div className="mt-8 bg-gradient-to-br from-[hsl(var(--musig-contrast))]/10 to-[hsl(var(--musig-primary))]/10 rounded-xl border-2 border-[hsl(var(--musig-contrast))]/30 p-8 text-center">
                                <MapPin className="h-12 w-12 text-[hsl(var(--musig-primary))] mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-[hsl(var(--musig-primary))] mb-2">
                                    Unser Probelokal
                                </h3>
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d697.3061700364333!2d8.867176345141536!3d47.49589626201634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479a96abf445a797%3A0x26bc98540a0ccac1!2sSeegartenstrasse%2021%2C%208353%20Elgg!5e1!3m2!1sde!2sch!4v1768857013028!5m2!1sde!2sch" className="w-full h-100" loading="lazy"></iframe>

                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="text-3xl font-bold text-[hsl(var(--musig-primary))] mb-8">
                                Nachricht senden
                            </h2>

                            {status === 'success' ? (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
                                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-green-500 mb-2">Nachricht gesendet!</h3>
                                    <p className="text-[hsl(var(--muted-foreground))] mb-6">
                                        Vielen Dank für deine Nachricht. Wir werden uns so schnell wie möglich bei dir melden.
                                    </p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="text-[hsl(var(--musig-primary))] font-medium hover:underline"
                                    >
                                        Weitere Nachricht senden
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                        >
                                            Name
                                        </label>
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
                                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[hsl(var(--musig-primary))] focus:border-transparent outline-none transition-all ${errors.name ? 'border-red-500' : 'border-[hsl(var(--border))]'}`}
                                            placeholder="Ihr Name"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                        >
                                            E-Mail
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-[hsl(var(--border))] focus:ring-2 focus:ring-[hsl(var(--musig-primary))] focus:border-transparent outline-none transition-all"
                                            placeholder="ihre.email@beispiel.ch"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <label
                                            htmlFor="subject"
                                            className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                        >
                                            Betreff
                                        </label>
                                        <div className="relative">
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
                                                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[hsl(var(--musig-primary))] focus:border-transparent outline-none transition-all ${errors.subject ? 'border-red-500' : 'border-[hsl(var(--border))]'}`}
                                                placeholder="Worum geht es?"
                                                list="subject-suggestions"
                                            />
                                            <datalist id="subject-suggestions">
                                                <option value="Schnupperprobe" />
                                                <option value="Auftrittsanfrage" />
                                                <option value="Passivmitgliedschaft" />
                                                <option value="Sonstiges" />
                                            </datalist>
                                        </div>
                                        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                            Wählen Sie einen Vorschlag oder geben Sie einen eigenen Betreff ein.
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="message"
                                            className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2"
                                        >
                                            Nachricht
                                        </label>
                                        <textarea
                                            id="message"
                                            rows={6}
                                            required
                                            minLength={10}
                                            value={formData.message}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, message: val });
                                                setErrors({ ...errors, message: validateField('message', val) });
                                            }}
                                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[hsl(var(--musig-primary))] focus:border-transparent outline-none transition-all resize-none ${errors.message ? 'border-red-500' : 'border-[hsl(var(--border))]'}`}
                                            placeholder="Ihre Nachricht an uns..."
                                        />
                                        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                                    </div>

                                    {rateLimitMessage && (
                                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-600 text-sm">
                                            {rateLimitMessage}
                                        </div>
                                    )}

                                    {status === 'error' && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                            Es ist ein Fehler aufgetreten. Bitte versuche es später erneut oder schreibe uns direkt eine E-Mail.
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full bg-[hsl(var(--musig-primary))] text-white px-6 py-3 rounded-lg hover:bg-[hsl(var(--musig-primary))]/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === 'loading' ? (
                                            <>
                                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Wird gesendet...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="h-5 w-5" />
                                                Nachricht senden
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}


                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 bg-gradient-to-r from-[hsl(var(--musig-primary))]/5 to-[hsl(var(--musig-contrast))]/5">
                <div className="container-app">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-[hsl(var(--musig-primary))] mb-4">
                            Schnupperprobe gewünscht?
                        </h2>
                        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
                            Möchtest du uns persönlich kennenlernen? Komm doch einfach bei einer unserer
                            Proben vorbei – jeden 2. Montag um 20:00 Uhr. Wir wären froh um eine kurze Anmeldung!
                        </p>
                        <div className="inline-flex items-center gap-2 text-[hsl(var(--musig-primary))] font-medium">
                            <Clock className="h-5 w-5" />
                            Jeden 2. Montag (jeweils ungerade Kalenderwochen), 20:00 Uhr im Probelokal
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
    const wrapperProps = link ? { href: link, className: 'hover:text-[hsl(var(--musig-primary))] transition-colors' } : {};

    return (
        <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-[hsl(var(--musig-primary))] to-[hsl(var(--musig-primary))]/80 text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{title}</div>
                <ContentWrapper {...wrapperProps} className={`text-lg font-medium text-[hsl(var(--foreground))] ${link ? 'hover:text-[hsl(var(--musig-primary))] transition-colors' : ''}`}>
                    {content}
                </ContentWrapper>
                {subtitle && (
                    <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}

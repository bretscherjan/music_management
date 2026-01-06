

const ContactPage = () => {
    return (
        <div className="container mx-auto px-4 py-16 animate-fade-in-up">
            <h1 className="font-heading text-4xl font-bold text-charcoal mb-8">Kontakt</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-6">Schreiben Sie uns</h2>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
                            <textarea rows={4} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary"></textarea>
                        </div>
                        <button className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors w-full">
                            Senden
                        </button>
                    </form>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-charcoal">Postadresse</h3>
                        <p className="text-gray-600">Musig Elgg<br />Postfach 123<br />8353 Elgg</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-charcoal">Email</h3>
                        <p className="text-gray-600">info@musigelgg.ch</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;

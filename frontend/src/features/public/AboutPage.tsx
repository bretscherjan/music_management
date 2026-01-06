

const AboutPage = () => {
    return (
        <div className="container mx-auto px-4 py-16 animate-fade-in-up">
            <h1 className="font-heading text-4xl font-bold text-charcoal mb-8">Über Uns</h1>
            <p className="text-lg text-gray-700 max-w-3xl">
                Der Musikverein Elgg besteht seit über 100 Jahren. Wir sind mehr als nur ein Verein – wir sind eine Familie aus begeisterten Musikerinnen und Musikern.
            </p>
            {/* TODO: Add History, Board Members, Conductor */}
        </div>
    );
};

export default AboutPage;

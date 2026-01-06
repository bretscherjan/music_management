

const NewsPage = () => {
    return (
        <div className="container mx-auto px-4 py-16 animate-fade-in-up">
            <h1 className="font-heading text-4xl font-bold text-charcoal mb-8">Aktuelle News</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-gray-200"></div>
                        <div className="p-6">
                            <span className="text-secondary text-sm font-bold uppercase">News</span>
                            <h3 className="font-heading text-xl font-bold mt-2 mb-3">Beispiel Nachricht {item}</h3>
                            <p className="text-gray-600 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                            <button className="text-primary font-bold hover:underline">Weiterlesen</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NewsPage;

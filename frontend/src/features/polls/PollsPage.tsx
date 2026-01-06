
import { useEffect, useState } from 'react';
import { PollService } from '../../services/PollService';
import { Poll } from '../../api/web-api-client';

const PollsPage = () => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPolls();
    }, []);

    const loadPolls = async () => {
        try {
            setLoading(true);
            const data = await PollService.getAll();
            setPolls(data);
        } catch (err) {
            setError("Failed to load polls.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (pollId: number, optionId: number) => {
        try {
            await PollService.vote(pollId, optionId);
            loadPolls(); // Refresh to see updating counts
        } catch (err) {
            alert("Voting failed!");
            console.error(err);
        }
    };

    if (loading) return <div>Loading Polls...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-heading text-primary">Umfragen</h1>
            <div className="grid gap-6 md:grid-cols-2">
                {polls.map((poll) => (
                    <div key={poll.id} className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-2">{poll.title}</h2>
                        <p className="text-gray-600 mb-4">{poll.description}</p>
                        <div className="space-y-2">
                            {poll.options && poll.options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => option.id && handleVote(poll.id!, option.id)}
                                    className="w-full text-left px-4 py-2 border rounded hover:bg-gray-50 flex justify-between items-center"
                                >
                                    <span>{option.text}</span>
                                    <span className="bg-secondary text-white text-xs px-2 py-1 rounded-full">{option.votes ? option.votes.length : 0} votes</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 text-sm text-gray-500">
                            Due: {poll.dueDate ? new Date(poll.dueDate).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PollsPage;

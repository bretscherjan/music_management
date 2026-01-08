import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../helpers/apiService';
import { useEventCommunicationHelper } from '../../helpers/useEventCommunicationHelper';
import type { EventResponseDto } from '../../api/generated/ApiClient';

export const EventDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<EventResponseDto | null>(null);
    const { posts, surveys, createPost, voteSurvey } = useEventCommunicationHelper(id);
    const [activeTab, setActiveTab] = useState<'posts' | 'surveys'>('posts');
    const [newPostContent, setNewPostContent] = useState('');

    useEffect(() => {
        if (id) {
            apiService.eventsGET(id).then(setEvent).catch(console.error);
        }
    }, [id]);

    const handlePostSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPostContent.trim()) {
            createPost(newPostContent);
            setNewPostContent('');
        }
    };

    if (!event) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <Link to="/events-member" className="text-gray-500 hover:text-gray-700 mb-2 inline-block">&larr; Zurück</Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-primary-800">{event.title}</h1>
                        <p className="text-gray-600 mt-1">
                            {new Date(event.startTime!).toLocaleDateString('de-CH')} {new Date(event.startTime!).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-gray-500">{event.location}</p>
                    </div>
                    <Link to={`/events/${id}/checkin`} className="btn btn-secondary">Check In</Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`px-6 py-3 font-medium ${activeTab === 'posts' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Pinnwand
                </button>
                <button
                    className={`px-6 py-3 font-medium ${activeTab === 'surveys' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('surveys')}
                >
                    Umfragen ({surveys.length})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'posts' && (
                <div className="max-w-3xl">
                    <form onSubmit={handlePostSubmit} className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-3"
                            rows={3}
                            placeholder="Schreibe etwas an die Pinnwand..."
                            value={newPostContent}
                            onChange={e => setNewPostContent(e.target.value)}
                        />
                        <div className="text-right">
                            <button type="submit" className="btn btn-primary px-6">Posten</button>
                        </div>
                    </form>

                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-800">{post.authorName || 'Unbekannt'}</span>
                                    <span className="text-xs text-gray-400">{new Date(post.createdAt!).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700">{post.content}</p>
                            </div>
                        ))}
                        {posts.length === 0 && <p className="text-gray-500 text-center py-8">Noch keine Beiträge.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'surveys' && (
                <div className="max-w-3xl space-y-6">
                    {surveys.map(survey => (
                        <div key={survey.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{survey.title}</h3>
                            <p className="text-gray-600 mb-4">{survey.description}</p>

                            <div className="space-y-2">
                                {survey.options?.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => !survey.userHasVoted && voteSurvey(survey.id!, option.id!)}
                                        disabled={survey.userHasVoted || survey.hasEnded}
                                        className={`w-full text-left p-3 rounded-lg border flex justify-between items-center transition-colors ${survey.userHasVoted || survey.hasEnded
                                            ? 'bg-gray-50 border-gray-200 cursor-default'
                                            : 'hover:bg-primary-50 hover:border-primary-200 border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            {option.isSelectedByUser && <span className="mr-2 text-green-600 font-bold">✓</span>}
                                            <span>{option.text}</span>
                                        </div>
                                        {/* Show results if allowed */}
                                        {(survey.userHasVoted || survey.hasEnded) && !survey.isBlindVote && (
                                            <span className="font-bold text-primary-700">
                                                {option.voteCount || 0} Stimmen ({option.percentage || 0}%)
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {survey.userHasVoted && (
                                <p className="text-sm text-green-600 mt-3 font-medium">Du hast abgestimmt.</p>
                            )}
                            {survey.isBlindVote && (survey.userHasVoted || !survey.hasEnded) && (
                                <p className="text-xs text-gray-400 mt-1">Stimmen sind verdeckt (Blind Vote).</p>
                            )}
                        </div>
                    ))}
                    {surveys.length === 0 && <p className="text-gray-500 text-center py-8">Keine aktiven Umfragen.</p>}
                </div>
            )}
        </div>
    );
};

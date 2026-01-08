import React, { useState } from 'react';
import { useSurveyMutations } from './surveyHelper';
import type { SurveyResponseDto } from '../../api/generated/ApiClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Check, Lock, AlertTriangle } from 'lucide-react';

interface SurveyCardProps {
    survey: SurveyResponseDto;
}

export const SurveyCard: React.FC<SurveyCardProps> = ({ survey }) => {
    const { voteSurvey } = useSurveyMutations();
    const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Determines if we should show results
    // Logic: If user has voted OR survey has ended. (Unless it's a blind vote that hasn't ended?)
    // But DTO usually hides results for blind votes until end.
    // If DTO has results (options have percentage), we show them.
    const showResults = survey.userHasVoted || survey.hasEnded;

    // Sort options by sortOrder or text
    const sortedOptions = [...(survey.options || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const handleOptionChange = (optionId: string) => {
        if (survey.userHasVoted || survey.hasEnded) return;

        if (survey.allowMultipleOptions) {
            setSelectedOptionIds(prev =>
                prev.includes(optionId)
                    ? prev.filter(id => id !== optionId)
                    : [...prev, optionId]
            );
        } else {
            setSelectedOptionIds([optionId]);
        }
    };

    const handleSubmit = () => {
        if (selectedOptionIds.length === 0) {
            setError("Bitte wähle mindestens eine Option.");
            return;
        }

        voteSurvey.mutate({
            surveyId: survey.id!,
            optionIds: selectedOptionIds,
            comment: comment
        }, {
            onError: () => setError("Fehler beim Speichern der Stimme.")
        });
    };

    const isBlindAndActive = survey.isBlindVote && !survey.hasEnded;

    return (
        <div className="bg-[#F9F7F2] rounded-xl shadow-card overflow-hidden border border-neutral-200">
            {/* Header - Burgundy */}
            <div className="bg-[#801010] p-4 text-white">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold">{survey.title}</h3>
                    {survey.isBlindVote && (
                        <span className="flex items-center text-xs bg-white/20 px-2 py-1 rounded">
                            <Lock className="w-3 h-3 mr-1" /> Anonym
                        </span>
                    )}
                </div>
                {survey.description && <p className="text-secondary-100 text-sm mt-1">{survey.description}</p>}
                {survey.endDate && (
                    <p className="text-xs text-white/70 mt-2">
                        Endet am: {new Date(survey.endDate).toLocaleDateString('de-CH')}
                    </p>
                )}
            </div>

            {/* Body */}
            <div className="p-6">

                {showResults ? (
                    // RESULTS VIEW
                    <div className="space-y-4">
                        {isBlindAndActive ? (
                            <div className="bg-secondary-50 border border-secondary-200 p-4 rounded-lg flex items-start text-secondary-900">
                                <Lock className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm">Verdeckte Abstimmung</p>
                                    <p className="text-sm">Die Ergebnisse werden erst nach Abschluss der Umfrage am {survey.endDate ? new Date(survey.endDate).toLocaleDateString('de-CH') : 'Enddatum'} veröffentlicht.</p>
                                    <div className="mt-2 text-sm font-medium">
                                        Deine Wahl: {sortedOptions.filter(o => o.isSelectedByUser).map(o => o.text).join(", ")}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sortedOptions}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="text"
                                            type="category"
                                            width={100}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            formatter={(value: number | undefined) => [`${value || 0}%`, 'Stimmen']}
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="percentage" barSize={20} radius={[0, 4, 4, 0]}>
                                            {sortedOptions.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.isSelectedByUser ? '#801010' : '#C5A059'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="text-center text-xs text-neutral-500 mt-2">
                                    Gesamtstimmen: {survey.totalVotes || 0}
                                </div>
                            </div>
                        )}

                        {survey.userHasVoted && !isBlindAndActive && (
                            <p className="text-green-700 text-sm font-medium flex items-center justify-center bg-green-50 p-2 rounded">
                                <Check className="w-4 h-4 mr-2" /> Du hast abgestimmt.
                            </p>
                        )}
                    </div>
                ) : (
                    // VOTING VIEW
                    <div className="space-y-4">
                        <div className="space-y-3">
                            {sortedOptions.map(option => {
                                const isSelected = selectedOptionIds.includes(option.id!);
                                return (
                                    <label
                                        key={option.id}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'border-[#C5A059] bg-[#C5A059]/10 shadow-sm'
                                            : 'border-neutral-200 hover:border-[#C5A059]/50 bg-white'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${isSelected ? 'border-[#C5A059] bg-[#C5A059]' : 'border-neutral-300'
                                            }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input
                                            type={survey.allowMultipleOptions ? "checkbox" : "radio"}
                                            name={`survey-${survey.id}`}
                                            value={option.id}
                                            checked={isSelected}
                                            onChange={() => handleOptionChange(option.id!)}
                                            className="hidden"
                                        />
                                        <span className="text-neutral-800 font-medium">{option.text}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="pt-2">
                            <input
                                type="text"
                                placeholder="Optionaler Kommentar..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full text-sm border-b border-neutral-300 bg-transparent focus:border-[#C5A059] focus:outline-none py-2 transition-colors placeholder:text-neutral-400"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center text-primary-700 text-sm bg-primary-50 p-2 rounded">
                                <AlertTriangle className="w-4 h-4 mr-2" /> {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={voteSurvey.isPending}
                            className="w-full bg-[#C5A059] hover:bg-[#b08d48] text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {voteSurvey.isPending ? 'Speichere...' : 'Abstimmen'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

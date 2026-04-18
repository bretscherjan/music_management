// Poll Types v2 – mirrors Prisma Poll models

import type { User } from './user';

export type PollKind = 'SURVEY' | 'VOTE';
export type PollType = 'SINGLE' | 'MULTIPLE';
export type PollAnonymity = 'FULLY_ANONYMOUS' | 'VISIBLE_TO_ADMINS' | 'VISIBLE_TO_ALL';
export type PollResultsVisibility = 'ADMINS_ONLY' | 'AFTER_VOTE' | 'ALWAYS';
export type PollStatus = 'ACTIVE' | 'CLOSED';
export type PollAudienceTargetType = 'ALL' | 'REGISTER' | 'USER';

export interface PollAudienceTarget {
    id?: number;
    targetType: PollAudienceTargetType;
    userId?: number;
    user?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
    registerId?: number;
    register?: { id: number; name: string } | null;
}

export interface PollOption {
    id: number;
    text: string;
    addedById?: number | null;
    addedBy?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
}

export interface PollVoterInfo {
    id: number;
    firstName?: string;
    lastName?: string;
    optionIds?: number[];
    textAnswer?: string | null;
}

export interface PollTextAnswerResult {
    userId?: number;
    firstName?: string;
    lastName?: string;
    answer: string;
}

export interface PollOptionResult extends PollOption {
    voteCount: number;
    percentage: number;
    voters?: PollVoterInfo[];
}

export interface PollResultSummary {
    options: PollOptionResult[];
    totalVotes: number;
    totalParticipants: number;
    /** Populated for SURVEY polls (free-text answers) */
    textAnswers?: PollTextAnswerResult[];
}

export interface Poll {
    id: number;
    title: string;
    question: string;
    pollKind: PollKind;
    type: PollType;
    maxChoices: number;
    anonymity: PollAnonymity;
    resultsVisibility: PollResultsVisibility;
    allowCustomOptions: boolean;
    status: PollStatus;
    endsAt?: string | null;
    createdBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
    createdAt: string;
    updatedAt: string;
    // Per-user computed fields
    hasVoted: boolean;
    myVoteOptionIds: number[];
    /** Free-text answer for SURVEY polls (null if not answered) */
    myTextAnswer?: string | null;
    showResults: boolean;
    summary?: PollResultSummary | null;
    options?: PollOption[];
    // Admin-only: audience targeting rules
    audienceRules?: PollAudienceTarget[];
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface PollAnalyticsOption {
    id: number;
    text: string;
    voteCount: number;
    percentage: number;
    voters: PollVoterInfo[];
}

export interface PollAnalyticsData {
    poll: Pick<Poll, 'id' | 'title' | 'question' | 'pollKind' | 'anonymity' | 'status' | 'endsAt' | 'createdAt'>;
    analytics: {
        totalVotes: number;
        totalParticipants: number;
        options: PollAnalyticsOption[];
        voters: PollVoterInfo[];
        /** Populated for SURVEY polls */
        textAnswers?: PollTextAnswerResult[];
    };
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreatePollAudienceRuleDto {
    targetType: PollAudienceTargetType;
    userId?: number;
    registerId?: number;
}

export interface CreatePollDto {
    title: string;
    question: string;
    pollKind: PollKind;
    type: PollType;
    maxChoices?: number;
    anonymity: PollAnonymity;
    resultsVisibility: PollResultsVisibility;
    allowCustomOptions: boolean;
    endsAt?: string | null;
    /** For VOTE polls only: predefined options (min 2). Empty for SURVEY polls. */
    options: string[];
    audienceRules?: CreatePollAudienceRuleDto[];
}

export interface UpdatePollOptionDto {
    id?: number;   // present for existing options, omitted for new ones
    text: string;
}

export interface UpdatePollDto {
    title?: string;
    question?: string;
    pollKind?: PollKind;
    type?: PollType;
    maxChoices?: number;
    anonymity?: PollAnonymity;
    resultsVisibility?: PollResultsVisibility;
    allowCustomOptions?: boolean;
    status?: PollStatus;
    endsAt?: string | null;
    audienceRules?: CreatePollAudienceRuleDto[];
    /** When provided, replaces all options. Deleted options reset their votes. */
    options?: UpdatePollOptionDto[];
}

export interface CastVoteDto {
    /** For VOTE polls */
    optionIds?: number[];
    /** For SURVEY polls */
    textAnswer?: string;
}

export interface CastVoteResponse {
    message: string;
    hasVoted: boolean;
    myVoteOptionIds: number[];
    myTextAnswer?: string | null;
    showResults: boolean;
    summary?: PollResultSummary | null;
}

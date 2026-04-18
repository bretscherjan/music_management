const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds the result summary for a poll, respecting 3-level anonymity rules:
 * - FULLY_ANONYMOUS: never expose voter identities to anyone
 * - VISIBLE_TO_ADMINS: expose voter names only to admins
 * - VISIBLE_TO_ALL: expose voter names to everyone who can see results
 *
 * For SURVEY polls (free-text): returns textAnswers list instead of option breakdown.
 * For VOTE polls: returns options with vote counts and percentages.
 */
function buildResultSummary(poll, currentUserId, isAdmin) {
    const canSeeVoters =
        poll.anonymity === 'VISIBLE_TO_ALL' ||
        (poll.anonymity === 'VISIBLE_TO_ADMINS' && isAdmin);

    if (poll.pollKind === 'SURVEY') {
        const totalParticipants = poll.textAnswers.length;
        const textAnswers = canSeeVoters
            ? poll.textAnswers.map(ta => ({
                userId: ta.userId,
                firstName: ta.user?.firstName,
                lastName: ta.user?.lastName,
                answer: ta.answer,
            }))
            : poll.textAnswers.map(ta => ({ answer: ta.answer })); // anonymous: no names
        return { textAnswers, totalParticipants, totalVotes: totalParticipants, options: [] };
    }

    // VOTE poll
    const totalVotes = poll.votes.length;
    const uniqueVoterIds = new Set(poll.votes.map(v => v.userId));
    const totalParticipants = uniqueVoterIds.size;

    const options = poll.options.map((opt) => {
        const optionVotes = poll.votes.filter(v => v.optionId === opt.id);
        const voteCount = optionVotes.length;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

        const voters = canSeeVoters
            ? optionVotes.map(v => ({
                id: v.userId,
                firstName: v.user?.firstName,
                lastName: v.user?.lastName,
            }))
            : undefined;

        return { id: opt.id, text: opt.text, addedById: opt.addedById, voteCount, percentage, voters };
    });

    return { options, totalVotes, totalParticipants, textAnswers: undefined };
}

/** Determines if current user can see the results */
function canSeeResults(poll, currentUserId, isAdmin) {
    if (isAdmin) return true;
    if (poll.resultsVisibility === 'ALWAYS') return true;
    if (poll.resultsVisibility === 'AFTER_VOTE') {
        // Check both option votes and text answers
        const hasOptionVote = poll.votes.some(v => v.userId === currentUserId);
        const hasTextAnswer = (poll.textAnswers ?? []).some(ta => ta.userId === currentUserId);
        return hasOptionVote || hasTextAnswer;
    }
    return false; // ADMINS_ONLY
}

/**
 * Audience filtering: returns a Prisma WHERE fragment for member-visible polls.
 * Admins bypass this (call with isAdmin=true to get null).
 * Logic:
 *   - No audienceRules records → visible to all
 *   - Has rules with targetType=ALL → visible to all
 *   - Has rules with targetType=USER userId=X → visible to user X
 *   - Has rules with targetType=REGISTER registerId=R → visible to users in register R
 */
async function getAudienceWhereClause(userId, isAdmin) {
    if (isAdmin) return {};

    // Users currently belong to at most one register in the Prisma schema.
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { registerId: true },
    });
    const userRegisterIds = user?.registerId ? [user.registerId] : [];

    return {
        OR: [
            // No audience rules = open to all
            { audienceRules: { none: {} } },
            // Explicitly targeted at everyone
            { audienceRules: { some: { targetType: 'ALL' } } },
            // Explicitly targeted at this user
            { audienceRules: { some: { targetType: 'USER', userId } } },
            // Targeted at a register the user is in
            ...(userRegisterIds.length > 0
                ? [{ audienceRules: { some: { targetType: 'REGISTER', registerId: { in: userRegisterIds } } } }]
                : []),
        ],
    };
}

// ─── Include helpers ──────────────────────────────────────────────────────────

const POLL_INCLUDE = {
    createdBy: { select: { id: true, firstName: true, lastName: true } },
    options: {
        orderBy: { createdAt: 'asc' },
        include: {
            addedBy: { select: { id: true, firstName: true, lastName: true } },
        },
    },
    votes: {
        include: {
            user: { select: { id: true, firstName: true, lastName: true } },
        },
    },
    textAnswers: {
        include: {
            user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
    },
    audienceRules: {
        include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            register: { select: { id: true, name: true } },
        },
    },
};

function serializePoll(poll, currentUserId, isAdmin) {
    const myVoteOptionIds = poll.votes
        .filter(v => v.userId === currentUserId)
        .map(v => v.optionId);

    const myTextAnswer = (poll.textAnswers ?? []).find(ta => ta.userId === currentUserId)?.answer ?? null;
    const hasVoted = myVoteOptionIds.length > 0 || myTextAnswer !== null;

    const showResults = canSeeResults(poll, currentUserId, isAdmin);
    const summary = showResults ? buildResultSummary(poll, currentUserId, isAdmin) : null;

    return {
        id: poll.id,
        title: poll.title,
        question: poll.question,
        pollKind: poll.pollKind,
        type: poll.type,
        maxChoices: poll.maxChoices,
        anonymity: poll.anonymity,
        resultsVisibility: poll.resultsVisibility,
        allowCustomOptions: poll.allowCustomOptions,
        status: poll.status,
        endsAt: poll.endsAt,
        createdBy: poll.createdBy,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        hasVoted,
        myVoteOptionIds,
        myTextAnswer,
        showResults,
        summary,
        options: poll.options.map(o => ({
            id: o.id,
            text: o.text,
            addedById: o.addedById,
            addedBy: o.addedBy,
        })),
        audienceRules: isAdmin ? poll.audienceRules.map(r => ({
            id: r.id,
            targetType: r.targetType,
            userId: r.userId,
            user: r.user,
            registerId: r.registerId,
            register: r.register,
        })) : undefined,
    };
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /polls
 * Returns polls visible to the current user, audience-filtered for members.
 */
const getAllPolls = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const audienceWhere = await getAudienceWhereClause(currentUserId, isAdmin);

    const polls = await prisma.poll.findMany({
        where: audienceWhere,
        include: POLL_INCLUDE,
        orderBy: { createdAt: 'desc' },
    });

    res.json({ polls: polls.map(p => serializePoll(p, currentUserId, isAdmin)) });
});

/**
 * GET /polls/:id
 */
const getPollById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const poll = await prisma.poll.findUnique({
        where: { id: parseInt(id) },
        include: POLL_INCLUDE,
    });

    if (!poll) throw new AppError('Abstimmung nicht gefunden', 404);

    // Non-admins: check audience access
    if (!isAdmin) {
        const audienceWhere = await getAudienceWhereClause(currentUserId, false);
        const accessible = await prisma.poll.findFirst({
            where: { id: parseInt(id), ...audienceWhere },
            select: { id: true },
        });
        if (!accessible) throw new AppError('Abstimmung nicht gefunden', 404);
    }

    res.json({ poll: serializePoll(poll, currentUserId, isAdmin) });
});

/**
 * GET /polls/:id/analytics
 * Admin only. Returns full analytics with all voter data.
 */
const getPollAnalytics = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
        where: { id: parseInt(id) },
        include: POLL_INCLUDE,
    });

    if (!poll) throw new AppError('Abstimmung nicht gefunden', 404);

    if (poll.pollKind === 'SURVEY') {
        // Free-text analytics: list all answers
        const totalParticipants = poll.textAnswers.length;
        const answers = poll.textAnswers.map(ta => ({
            userId: ta.userId,
            firstName: ta.user?.firstName,
            lastName: ta.user?.lastName,
            answer: ta.answer,
            createdAt: ta.createdAt,
        }));

        return res.json({
            poll: {
                id: poll.id,
                title: poll.title,
                question: poll.question,
                pollKind: poll.pollKind,
                anonymity: poll.anonymity,
                status: poll.status,
                endsAt: poll.endsAt,
                createdAt: poll.createdAt,
            },
            analytics: {
                totalVotes: totalParticipants,
                totalParticipants,
                options: [],
                voters: poll.anonymity === 'FULLY_ANONYMOUS' ? [] : answers.map(a => ({
                    id: a.userId,
                    firstName: a.firstName,
                    lastName: a.lastName,
                    optionIds: [],
                    textAnswer: a.answer,
                })),
                textAnswers: poll.anonymity === 'FULLY_ANONYMOUS'
                    ? answers.map(a => ({ answer: a.answer }))
                    : answers,
            },
        });
    }

    // VOTE poll analytics
    const totalVotes = poll.votes.length;
    const uniqueVoters = [...new Set(poll.votes.map(v => v.userId))];
    const totalParticipants = uniqueVoters.length;

    const options = poll.options.map((opt) => {
        const optionVotes = poll.votes.filter(v => v.optionId === opt.id);
        const voteCount = optionVotes.length;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const voters = optionVotes.map(v => ({
            id: v.userId,
            firstName: v.user?.firstName,
            lastName: v.user?.lastName,
        }));
        return { id: opt.id, text: opt.text, voteCount, percentage, voters };
    });

    // All voters with their selections
    const voterMap = {};
    poll.votes.forEach(v => {
        if (!voterMap[v.userId]) {
            voterMap[v.userId] = {
                id: v.userId,
                firstName: v.user?.firstName,
                lastName: v.user?.lastName,
                optionIds: [],
            };
        }
        voterMap[v.userId].optionIds.push(v.optionId);
    });

    res.json({
        poll: {
            id: poll.id,
            title: poll.title,
            question: poll.question,
            pollKind: poll.pollKind,
            anonymity: poll.anonymity,
            status: poll.status,
            endsAt: poll.endsAt,
            createdAt: poll.createdAt,
        },
        analytics: {
            totalVotes,
            totalParticipants,
            options,
            voters: poll.anonymity === 'FULLY_ANONYMOUS' ? [] : Object.values(voterMap),
            textAnswers: [],
        },
    });
});

/**
 * POST /polls
 * Admin only.
 */
const createPoll = asyncHandler(async (req, res) => {
    const {
        title,
        question,
        pollKind,
        type,
        maxChoices,
        anonymity,
        resultsVisibility,
        allowCustomOptions,
        endsAt,
        options,
        audienceRules,
    } = req.body;

    const kind = pollKind || 'SURVEY';

    // VOTE polls require at least 2 options; SURVEY polls use free text
    if (kind === 'VOTE' && (!options || options.length < 2)) {
        throw new AppError('Abstimmungen benötigen mindestens 2 Optionen', 400);
    }

    const resolvedMaxChoices = type === 'MULTIPLE'
        ? (maxChoices && maxChoices > 1 ? maxChoices : (options?.length ?? 2))
        : 1;

    const poll = await prisma.poll.create({
        data: {
            title,
            question,
            pollKind: kind,
            type: type || 'SINGLE',
            maxChoices: resolvedMaxChoices,
            anonymity: anonymity || 'FULLY_ANONYMOUS',
            resultsVisibility: resultsVisibility || 'AFTER_VOTE',
            allowCustomOptions: kind === 'VOTE' ? (allowCustomOptions ?? false) : false,
            endsAt: endsAt ? new Date(endsAt) : null,
            createdById: req.user.id,
            ...(kind === 'VOTE' && options && options.length > 0 && {
                options: {
                    create: options.map(text => ({ text })),
                },
            }),
            ...(audienceRules && audienceRules.length > 0 && {
                audienceRules: {
                    create: audienceRules.map(rule => ({
                        targetType: rule.targetType,
                        ...(rule.userId && { userId: rule.userId }),
                        ...(rule.registerId && { registerId: rule.registerId }),
                    })),
                },
            }),
        },
        include: POLL_INCLUDE,
    });

    res.status(201).json({ message: 'Abstimmung erfolgreich erstellt', poll: serializePoll(poll, req.user.id, true) });
});

/**
 * PUT /polls/:id
 * Admin only. All settings editable. Options can be added, edited, or removed
 * (removing/editing an option also deletes votes for that option).
 */
const updatePoll = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title, question, pollKind, type, maxChoices,
        anonymity, resultsVisibility, allowCustomOptions,
        status, endsAt, audienceRules, options,
    } = req.body;

    const existing = await prisma.poll.findUnique({
        where: { id: parseInt(id) },
        include: { options: true },
    });
    if (!existing) throw new AppError('Abstimmung nicht gefunden', 404);

    // Update poll scalar fields
    await prisma.poll.update({
        where: { id: parseInt(id) },
        data: {
            ...(title !== undefined && { title }),
            ...(question !== undefined && { question }),
            ...(pollKind !== undefined && { pollKind }),
            ...(type !== undefined && { type }),
            ...(maxChoices !== undefined && { maxChoices }),
            ...(anonymity !== undefined && { anonymity }),
            ...(resultsVisibility !== undefined && { resultsVisibility }),
            ...(allowCustomOptions !== undefined && { allowCustomOptions }),
            ...(status !== undefined && { status }),
            ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
        },
    });

    // Handle options array if provided
    if (options !== undefined && Array.isArray(options)) {
        const submittedIds = options.filter(o => o.id).map(o => o.id);
        const existingIds = existing.options.map(o => o.id);

        // Determine which existing options were removed
        const removedIds = existingIds.filter(eid => !submittedIds.includes(eid));

        // Delete removed options (cascade deletes their votes)
        if (removedIds.length > 0) {
            await prisma.pollOption.deleteMany({
                where: { id: { in: removedIds } },
            });
        }

        // Process each submitted option
        for (const opt of options) {
            if (opt.id) {
                // Existing option
                const original = existing.options.find(o => o.id === opt.id);
                if (original && original.text !== opt.text.trim()) {
                    // Text changed → reset votes for this option, update text
                    await prisma.pollVote.deleteMany({ where: { optionId: opt.id } });
                    await prisma.pollOption.update({
                        where: { id: opt.id },
                        data: { text: opt.text.trim() },
                    });
                }
                // Unchanged → nothing to do
            } else {
                // New option
                await prisma.pollOption.create({
                    data: { pollId: parseInt(id), text: opt.text.trim() },
                });
            }
        }
    }

    // Replace audience rules if provided
    if (audienceRules !== undefined) {
        await prisma.pollAudience.deleteMany({ where: { pollId: parseInt(id) } });
        if (audienceRules.length > 0) {
            await prisma.pollAudience.createMany({
                data: audienceRules.map(rule => ({
                    pollId: parseInt(id),
                    targetType: rule.targetType,
                    userId: rule.userId ?? null,
                    registerId: rule.registerId ?? null,
                })),
            });
        }
    }

    const updated = await prisma.poll.findUnique({ where: { id: parseInt(id) }, include: POLL_INCLUDE });
    res.json({ message: 'Abstimmung erfolgreich aktualisiert', poll: serializePoll(updated, req.user.id, true) });
});

/**
 * DELETE /polls/:id
 * Admin only.
 */
const deletePoll = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.poll.findUnique({ where: { id: parseInt(id) } });
    if (!existing) throw new AppError('Abstimmung nicht gefunden', 404);
    await prisma.poll.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Abstimmung erfolgreich gelöscht' });
});

/**
 * POST /polls/:id/vote
 * Authenticated members. Cast or update a vote (allowed until deadline).
 * - VOTE polls: expects { optionIds: number[] }
 * - SURVEY polls: expects { textAnswer: string }
 */
const castVote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { optionIds, textAnswer } = req.body;
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const poll = await prisma.poll.findUnique({
        where: { id: parseInt(id) },
        include: {
            options: true,
            votes: { where: { userId: currentUserId } },
            textAnswers: { where: { userId: currentUserId } },
        },
    });

    if (!poll) throw new AppError('Abstimmung nicht gefunden', 404);
    if (poll.status === 'CLOSED') throw new AppError('Diese Abstimmung ist geschlossen', 400);
    if (poll.endsAt && new Date() > poll.endsAt) {
        throw new AppError('Die Abstimmungsfrist ist abgelaufen', 400);
    }

    let responseData;

    if (poll.pollKind === 'SURVEY') {
        // Free-text answer: upsert PollTextAnswer
        if (!textAnswer || !textAnswer.trim()) {
            throw new AppError('Eine Antwort ist erforderlich', 400);
        }
        await prisma.pollTextAnswer.upsert({
            where: { pollId_userId: { pollId: parseInt(id), userId: currentUserId } },
            create: { pollId: parseInt(id), userId: currentUserId, answer: textAnswer.trim() },
            update: { answer: textAnswer.trim() },
        });
        responseData = { hasVoted: true, myVoteOptionIds: [], myTextAnswer: textAnswer.trim() };
    } else {
        // Option-based vote: replace existing votes
        if (!Array.isArray(optionIds) || optionIds.length === 0) {
            throw new AppError('Bitte mindestens eine Option wählen', 400);
        }
        const validOptionIds = poll.options.map(o => o.id);
        const invalidIds = optionIds.filter(oid => !validOptionIds.includes(oid));
        if (invalidIds.length > 0) throw new AppError('Ungültige Optionen', 400);

        if (optionIds.length > poll.maxChoices) {
            throw new AppError(`Maximal ${poll.maxChoices} Option(en) auswählbar`, 400);
        }

        await prisma.$transaction([
            prisma.pollVote.deleteMany({ where: { pollId: parseInt(id), userId: currentUserId } }),
            ...optionIds.map(optionId =>
                prisma.pollVote.create({ data: { pollId: parseInt(id), optionId, userId: currentUserId } })
            ),
        ]);
        responseData = { hasVoted: true, myVoteOptionIds: optionIds, myTextAnswer: null };
    }

    // Re-fetch with full include to compute results
    const updatedPoll = await prisma.poll.findUnique({
        where: { id: parseInt(id) },
        include: POLL_INCLUDE,
    });

    const showResults = canSeeResults(updatedPoll, currentUserId, isAdmin);
    const summary = showResults ? buildResultSummary(updatedPoll, currentUserId, isAdmin) : null;

    res.json({
        message: 'Stimme erfolgreich abgegeben',
        ...responseData,
        showResults,
        summary,
    });
});

/**
 * POST /polls/:id/options
 * Members can add exactly ONE custom option per poll.
 */
const addCustomOption = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const currentUserId = req.user.id;

    if (!text || !text.trim()) throw new AppError('Option darf nicht leer sein', 400);

    const poll = await prisma.poll.findUnique({ where: { id: parseInt(id) } });
    if (!poll) throw new AppError('Abstimmung nicht gefunden', 404);
    if (poll.status === 'CLOSED') throw new AppError('Diese Abstimmung ist geschlossen', 400);
    if (!poll.allowCustomOptions) throw new AppError('Eigene Optionen sind nicht erlaubt', 403);

    // Enforce 1-custom-option-per-user limit
    const existingCustom = await prisma.pollOption.count({
        where: { pollId: parseInt(id), addedById: currentUserId },
    });
    if (existingCustom >= 1) {
        throw new AppError('Du hast bereits eine eigene Option hinzugefügt', 409);
    }

    const option = await prisma.pollOption.create({
        data: { pollId: parseInt(id), text: text.trim(), addedById: currentUserId },
        include: { addedBy: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.status(201).json({ message: 'Option hinzugefügt', option });
});

module.exports = {
    getAllPolls,
    getPollById,
    getPollAnalytics,
    createPoll,
    updatePoll,
    deletePoll,
    castVote,
    addCustomOption,
};

const express = require('express');
const router = express.Router();
const { z } = require('zod');

const pollController = require('../controllers/poll.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permissionCheck } = require('../middlewares/permission.middleware');
const { validate } = require('../middlewares/validate.middleware');

// ─── Validation Schemas ───────────────────────────────────────────────────────

const idParam = {
    params: z.object({ id: z.string().regex(/^\d+$/, 'Ungültige Poll-ID') }),
};

const audienceRuleSchema = z.object({
    targetType: z.enum(['ALL', 'REGISTER', 'USER']),
    userId: z.number().int().positive().optional(),
    registerId: z.number().int().positive().optional(),
});

const createPollSchema = {
    body: z.object({
        title: z.string().min(1).max(200),
        question: z.string().min(1),
        pollKind: z.enum(['SURVEY', 'VOTE']).optional(),
        type: z.enum(['SINGLE', 'MULTIPLE']).optional(),
        maxChoices: z.number().int().min(1).optional(),
        anonymity: z.enum(['FULLY_ANONYMOUS', 'VISIBLE_TO_ADMINS', 'VISIBLE_TO_ALL']).optional(),
        resultsVisibility: z.enum(['ADMINS_ONLY', 'AFTER_VOTE', 'ALWAYS']).optional(),
        allowCustomOptions: z.boolean().optional(),
        endsAt: z.string().datetime({ offset: true }).nullable().optional(),
        // For VOTE polls: min 2 options required. For SURVEY polls: options array can be empty.
        options: z.array(z.string().min(1)).optional().default([]),
        audienceRules: z.array(audienceRuleSchema).optional(),
    }),
};

const updatePollSchema = {
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        question: z.string().min(1).optional(),
        pollKind: z.enum(['SURVEY', 'VOTE']).optional(),
        type: z.enum(['SINGLE', 'MULTIPLE']).optional(),
        maxChoices: z.number().int().min(1).optional(),
        anonymity: z.enum(['FULLY_ANONYMOUS', 'VISIBLE_TO_ADMINS', 'VISIBLE_TO_ALL']).optional(),
        resultsVisibility: z.enum(['ADMINS_ONLY', 'AFTER_VOTE', 'ALWAYS']).optional(),
        allowCustomOptions: z.boolean().optional(),
        status: z.enum(['ACTIVE', 'CLOSED']).optional(),
        endsAt: z.string().datetime({ offset: true }).nullable().optional(),
        audienceRules: z.array(audienceRuleSchema).optional(),
        options: z.array(
            z.object({
                id: z.number().int().positive().optional(),
                text: z.string().min(1).max(200),
            })
        ).min(2, 'Mindestens 2 Optionen erforderlich').optional(),
    }),
};

const castVoteSchema = {
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: z.object({
        // For VOTE polls: array of option IDs
        optionIds: z.array(z.number().int().positive()).optional(),
        // For SURVEY polls: free-text answer
        textAnswer: z.string().min(1).max(2000).optional(),
    }).refine(
        data => (data.optionIds && data.optionIds.length > 0) || (data.textAnswer && data.textAnswer.trim().length > 0),
        { message: 'Bitte eine Option wählen oder eine Antwort eingeben' }
    ),
};

const addOptionSchema = {
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: z.object({ text: z.string().min(1).max(200) }),
};

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/', authMiddleware, pollController.getAllPolls);

router.get('/:id', authMiddleware, validate(idParam), pollController.getPollById);

/** GET /api/polls/:id/analytics — Admin only */
router.get(
    '/:id/analytics',
    authMiddleware,
    permissionCheck('polls:write'),
    validate(idParam),
    pollController.getPollAnalytics
);

router.post(
    '/',
    authMiddleware,
    permissionCheck('polls:write'),
    validate(createPollSchema),
    pollController.createPoll
);

router.put(
    '/:id',
    authMiddleware,
    permissionCheck('polls:write'),
    validate(updatePollSchema),
    pollController.updatePoll
);

router.delete(
    '/:id',
    authMiddleware,
    permissionCheck('polls:write'),
    validate(idParam),
    pollController.deletePoll
);

router.post(
    '/:id/vote',
    authMiddleware,
    validate(castVoteSchema),
    pollController.castVote
);

router.post(
    '/:id/options',
    authMiddleware,
    validate(addOptionSchema),
    pollController.addCustomOption
);

module.exports = router;

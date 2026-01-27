const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances in development
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// --------------------------------------------------------
// AUDIT LOG MIDDLEWARE
// --------------------------------------------------------
const MODELS_TO_AUDIT = ['User', 'File', 'Register', 'Event', 'Folder', 'SheetMusic'];

prisma.$use(async (params, next) => {
    const { model, action, args } = params;

    // Only audit specific models and actions
    if (!model || !MODELS_TO_AUDIT.includes(model)) {
        return next(params);
    }

    // Determine type of change
    const isUpdate = action === 'update' || action === 'updateMany';
    const isDelete = action === 'delete' || action === 'deleteMany';
    // const isCreate = action === 'create' || action === 'createMany'; // Optional: audit creation too? User requested "changes", usually implies existing data modification. Let's focus on update/delete for "forensics" of lost data or changes.

    if (!isUpdate && !isDelete) {
        return next(params);
    }

    try {
        // 1. Fetch data BEFORE change
        let before = null;
        if (action === 'update' || action === 'delete') {
            before = await prisma[model.toLowerCase()].findUnique({
                where: args.where,
            });
        }

        // 2. Perform the Action
        const result = await next(params);

        // 3. Prepare Audit Entry
        // IMPORTANT: We need the userId of the person making the change.
        // in Express, this is usually req.user.id. 
        // Since Prisma Middleware doesn't have access to Express req directly,
        // we have two options:
        // A) Use AsyncLocalStorage (modern, clean).
        // B) Pass userId in params.args (hacky).

        // Use AsyncLocalStorage context if available, or undefined.
        // For now, we'll try to retrieve it from a global store if we implement AsyncLocalStorage later,
        // OR we rely on the controllers to pass a special "auditContext" to the prisma call which we strip out here?
        // Actually, for a quick implementation without rewriting EVERY svc call signature, AsyncLocalStorage is best.
        // BUT, setting up ALS requires wrapping every request.

        // ALTERNATIVE: For now, we will just log the change. If we want userId, 
        // we might need to rely on the Controller explicitly creating the log for critical actions,
        // OR we use the "Context" approach.

        // Let's check if the user provided context in the args (e.g. via a custom extension or just stripped arg).
        // A common pattern is extending the Prisma Client, but $use is deprecated in favor of $extends.
        // However, existing codebase uses standard Prisma.

        // Let's assume for this specific requirement "UserId: Verknüpfung zum Verursacher",
        // we will use a simple AsyncLocalStorage solution in the next step (server.js update).

        const { getAuditContext } = require('./auditContext');
        const context = getAuditContext(); // { userId: 123, ip: '...' }

        if (context && context.userId) {
            // 4. Log to AuditLog (Async, don't await to block response?) -> better await to ensure safety.
            await prisma.auditLog.create({
                data: {
                    userId: context.userId,
                    action: `${model.toUpperCase()}_${action.toUpperCase()}`,
                    entity: model,
                    entityId: result.id ? String(result.id) : (before?.id ? String(before.id) : 'unknown'),
                    oldValue: before, // JSON
                    newValue: action.startsWith('delete') ? null : result, // JSON
                    metadata: {
                        where: args.where,
                        ip: context.ip,
                        userAgent: context.userAgent
                    }
                }
            });
        }

        return result;

    } catch (err) {
        console.error('Audit Log Error:', err);
        // Don't fail the request if audit fails, but maybe log to file system?
        // For security, strict systems might want to fail. 
        // For this app, let's allow it but log error.
        throw err; // Actually, if the action failed, we rethrow. If audit failed? 
        // next(params) already ran.
    }
});

module.exports = prisma;

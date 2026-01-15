const { ZodError } = require('zod');

/**
 * Validation Middleware Factory
 * Creates middleware that validates request data against Zod schemas
 * 
 * @param {Object} schemas - Object containing Zod schemas for body, params, query
 * @param {import('zod').ZodSchema} [schemas.body] - Schema for request body
 * @param {import('zod').ZodSchema} [schemas.params] - Schema for URL parameters
 * @param {import('zod').ZodSchema} [schemas.query] - Schema for query parameters
 * @returns {Function} Express middleware function
 * 
 * @example
 * const { z } = require('zod');
 * 
 * const createUserSchema = {
 *   body: z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8)
 *   })
 * };
 * 
 * router.post('/users', validate(createUserSchema), createUser);
 */
const validate = (schemas) => {
    return async (req, res, next) => {
        try {
            // Validate body if schema provided
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }

            // Validate params if schema provided
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }

            // Validate query if schema provided
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                return res.status(400).json({
                    message: 'Validation failed',
                    errors: formattedErrors
                });
            }
            next(error);
        }
    };
};

module.exports = { validate };

const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

/**
 * Get all tables and their metadata
 */
const getTables = asyncHandler(async (req, res) => {
    // MySQL specific query to get table names and row counts
    const tables = await prisma.$queryRaw`
        SELECT 
            TABLE_NAME as name, 
            TABLE_ROWS as rowCount,
            DATA_LENGTH as dataSize,
            CREATE_TIME as createdAt
        FROM information_schema.tables 
        WHERE TABLE_SCHEMA = (SELECT DATABASE())
    `;
    res.json(tables);
});

/**
 * Get table schema/columns
 */
const getTableColumns = asyncHandler(async (req, res) => {
    const { tableName } = req.params;

    const columns = await prisma.$queryRawUnsafe(`
        SHOW COLUMNS FROM ${tableName}
    `);
    res.json(columns);
});

/**
 * Get table data (paginated)
 */
const getTableData = asyncHandler(async (req, res) => {
    const { tableName } = req.params;
    const { page = 1, limit = 50, sortBy, sortOrder = 'asc' } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `SELECT * FROM ${tableName}`;

    if (sortBy) {
        query += ` ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
    }

    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const data = await prisma.$queryRawUnsafe(query);

    // Get total count
    const totalCountResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
    const totalCount = Number(totalCountResult[0].count);

    res.json({
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit))
        }
    });
});

/**
 * Execute custom SQL (Admin only, use with caution)
 */
const executeSql = asyncHandler(async (req, res) => {
    const { sql } = req.body;

    if (!sql) throw new AppError('SQL query is required', 400);

    // Detect if it's a SELECT or modifying query
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('SHOW') || sql.trim().toUpperCase().startsWith('DESCRIBE');

    try {
        const result = await prisma.$queryRawUnsafe(sql);
        res.json({
            success: true,
            result,
            type: isSelect ? 'SELECT' : 'NON-SELECT'
        });
    } catch (error) {
        throw new AppError(`SQL Error: ${error.message}`, 400);
    }
});

/**
 * Update a specific row
 */
const updateRow = asyncHandler(async (req, res) => {
    const { tableName } = req.params;
    const { primaryKey, primaryKeyValue, data } = req.body;

    if (!primaryKey || primaryKeyValue === undefined || !data) {
        throw new AppError('Missing update parameters', 400);
    }

    // Dynamic update query
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), primaryKeyValue];

    try {
        await prisma.$executeRawUnsafe(
            `UPDATE ${tableName} SET ${updates} WHERE ${primaryKey} = ?`,
            ...values
        );
        res.json({ success: true, message: 'Row updated' });
    } catch (error) {
        throw new AppError(`Update Error: ${error.message}`, 400);
    }
});

module.exports = {
    getTables,
    getTableColumns,
    getTableData,
    executeSql,
    updateRow
};

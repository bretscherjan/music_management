const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../middlewares/errorHandler.middleware');

const prisma = new PrismaClient();

// Identifier regex: only a-z, A-Z, 0-9, underscore — no SQL metacharacters
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validate that a table/column name is a safe SQL identifier AND that the
 * table actually exists in the current database (prevents SQL injection via
 * $queryRawUnsafe where parameterisation is not possible for identifiers).
 */
async function assertValidTable(tableName) {
    if (!SAFE_IDENTIFIER.test(tableName)) {
        throw new AppError('Invalid table name', 400);
    }
    const rows = await prisma.$queryRaw`
        SELECT COUNT(*) AS cnt FROM information_schema.tables
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tableName}
    `;
    if (Number(rows[0].cnt) === 0) {
        throw new AppError('Table not found', 404);
    }
}

function assertValidColumn(colName) {
    if (!SAFE_IDENTIFIER.test(colName)) {
        throw new AppError(`Invalid column name: ${colName}`, 400);
    }
}

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
        WHERE TABLE_SCHEMA = DATABASE()
    `;

    res.json(tables);
});

/**
 * Get foreign key relations
 */
const getRelations = asyncHandler(async (req, res) => {
    // MySQL specific query to get foreign key constraints
    const relations = await prisma.$queryRaw`
        SELECT 
            TABLE_NAME as tableName, 
            COLUMN_NAME as columnName, 
            CONSTRAINT_NAME as constraintName, 
            REFERENCED_TABLE_NAME as referencedTableName, 
            REFERENCED_COLUMN_NAME as referencedColumnName
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND REFERENCED_TABLE_SCHEMA = DATABASE()
          AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    res.json(relations);
});

/**
 * Get table schema/columns
 */
const getTableColumns = asyncHandler(async (req, res) => {
    const { tableName } = req.params;
    await assertValidTable(tableName);

    const columns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`${tableName}\``);
    res.json(columns);
});

/**
 * Get table data (paginated)
 */
const getTableData = asyncHandler(async (req, res) => {
    const { tableName } = req.params;
    const { page = 1, limit = 50, sortBy, sortOrder = 'asc' } = req.query;

    await assertValidTable(tableName);
    if (sortBy) assertValidColumn(sortBy);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `SELECT * FROM \`${tableName}\``;

    if (sortBy) {
        query += ` ORDER BY \`${sortBy}\` ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
    }

    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const data = await prisma.$queryRawUnsafe(query);

    const totalCountResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM \`${tableName}\``);
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

    await assertValidTable(tableName);
    assertValidColumn(primaryKey);
    Object.keys(data).forEach(assertValidColumn);

    const updates = Object.keys(data).map(key => `\`${key}\` = ?`).join(', ');
    const values = [...Object.values(data), primaryKeyValue];

    try {
        await prisma.$executeRawUnsafe(
            `UPDATE \`${tableName}\` SET ${updates} WHERE \`${primaryKey}\` = ?`,
            ...values
        );
        res.json({ success: true, message: 'Row updated' });
    } catch (error) {
        throw new AppError(`Update Error: ${error.message}`, 400);
    }
});

module.exports = {
    getTables,
    getRelations,
    getTableColumns,
    getTableData,
    executeSql,
    updateRow
};

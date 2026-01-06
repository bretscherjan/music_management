import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Events
 *   - name: Files
 *   - name: Governance
 *   - name: Members
 *   - name: Polls
 */

// EVENTS
/**
 * @swagger
 * /api/Events:
 *   get:
 *     tags: [Events]
 *     operationId: eventsAll
 *     summary: Get all events
 *     parameters:
 *       - in: query
 *         name: futureOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/EventDto'
 */
router.get('/Events', (req, res) => res.json([]));

/**
 * @swagger
 * /api/Events/{id}/attendance:
 *   get:
 *     tags: [Events]
 *     operationId: eventsGetAttendance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/AttendanceDto'
 *   put:
 *     tags: [Events]
 *     operationId: setAttendance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetAttendanceDto'
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/Events/:id/attendance', (req, res) => res.json([]));
router.put('/Events/:id/attendance', (req, res) => res.sendStatus(200));


// FILES
/**
 * @swagger
 * /api/Files:
 *   get:
 *     tags: [Files]
 *     operationId: filesAll
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/FileEntity'
 */
router.get('/Files', (req, res) => res.json([]));

/**
 * @swagger
 * /api/Files/folders:
 *   post:
 *     tags: [Files]
 *     operationId: folders
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFolderDto'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileEntity'
 */
router.post('/Files/folders', (req, res) => res.json({}));

/**
 * @swagger
 * /api/Files/{id}:
 *   delete:
 *     tags: [Files]
 *     operationId: files
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/Files/:id', (req, res) => res.sendStatus(200));

/**
 * @swagger
 * /api/Files/upload:
 *   post:
 *     tags: [Files]
 *     operationId: ignoreUpload
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/Files/upload', (req, res) => res.json({}));


// GOVERNANCE
/**
 * @swagger
 * /api/Governance/requests:
 *   get:
 *     tags: [Governance]
 *     operationId: requestsAll
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/RoleChangeRequestDto'
 *   post:
 *     tags: [Governance]
 *     operationId: requests
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequestDto'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleChangeRequestDto'
 */
router.get('/Governance/requests', (req, res) => res.json([]));
router.post('/Governance/requests', (req, res) => res.json({}));

/**
 * @swagger
 * /api/Governance/requests/{id}/approve:
 *   post:
 *     tags: [Governance]
 *     operationId: approve
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/Governance/requests/:id/approve', (req, res) => res.sendStatus(200));


// MEMBERS
/**
 * @swagger
 * /api/Members:
 *   get:
 *     tags: [Members]
 *     operationId: usersAll
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/UserDetailDto'
 */
router.get('/Members', (req, res) => res.json([]));

/**
 * @swagger
 * /api/Members/{id}:
 *   get:
 *     tags: [Members]
 *     operationId: users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDetailDto'
 */
router.get('/Members/:id', (req, res) => res.json({}));


// POLLS
/**
 * @swagger
 * /api/Polls:
 *   get:
 *     tags: [Polls]
 *     operationId: pollsAll
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 $ref: '#/components/schemas/Poll'
 *   post:
 *     tags: [Polls]
 *     operationId: polls
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePollDto'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Poll'
 */
router.get('/Polls', (req, res) => res.json([]));
router.post('/Polls', (req, res) => res.json({}));

/**
 * @swagger
 * /api/Polls/{id}/vote:
 *   post:
 *     tags: [Polls]
 *     operationId: vote
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteDto'
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/Polls/:id/vote', (req, res) => res.sendStatus(200));

export default router;

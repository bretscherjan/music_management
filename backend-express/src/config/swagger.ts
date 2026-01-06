import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Musig Elgg API',
            version: '1.0.0',
            description: 'API for Musig Elgg application',
        },
        servers: [
            {
                url: `http://localhost:${config.port}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                LoginDto: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                    },
                },
                UserDetailDto: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        email: { type: 'string' },
                        instrument: { type: 'string' },
                        phone: { type: 'string' },
                        address: { type: 'string' },
                        zip: { type: 'string' },
                        city: { type: 'string' },
                        roles: { type: 'array', items: { type: 'string' } },
                        isInitialPassword: { type: 'boolean' }
                    }
                },
                // Events
                EventDto: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        date: { type: 'string', format: 'date-time' },
                        location: { type: 'string' },
                        type: { type: 'string' },
                        attendanceStatus: { type: 'string' }
                    }
                },
                SetAttendanceDto: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        comment: { type: 'string' }
                    }
                },
                AttendanceDto: {
                    type: 'object',
                    properties: {
                        userId: { type: 'integer' },
                        user: { $ref: '#/components/schemas/UserDetailDto' },
                        status: { type: 'string' },
                        comment: { type: 'string' }
                    }
                },
                // Files
                FileEntity: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        isFolder: { type: 'boolean' },
                        size: { type: 'integer' },
                        parentId: { type: 'integer', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        extension: { type: 'string' }
                    }
                },
                CreateFolderDto: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        parentId: { type: 'integer', nullable: true },
                        accessLevel: { type: 'string' }
                    }
                },
                // Governance
                RoleChangeRequestDto: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        requestorId: { type: 'integer' },
                        requestorName: { type: 'string' },
                        targetUserId: { type: 'integer' },
                        targetUserName: { type: 'string' },
                        newRole: { type: 'string' },
                        newRoleName: { type: 'string' },
                        status: { type: 'string' },
                        requestedByUserId: { type: 'integer' },
                        requestedByName: { type: 'string' },
                        requestedAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreateRoleRequestDto: {
                    type: 'object',
                    properties: {
                        targetUserId: { type: 'integer' },
                        newRole: { type: 'string' }
                    }
                },
                // Polls
                Poll: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        dueDate: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean' },
                        options: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, text: { type: 'string' } } } },
                        myVoteOptionId: { type: 'integer', nullable: true },
                        creatorId: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                CreatePollDto: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        dueDate: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean' },
                        options: { type: 'array', items: { type: 'string' } }
                    }
                },
                VoteDto: {
                    type: 'object',
                    properties: {
                        optionId: { type: 'integer' }
                    }
                }
            },
        },
    },
    apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);

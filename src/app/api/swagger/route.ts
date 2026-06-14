import { NextRequest, NextResponse } from 'next/server';
import { createSwaggerSpec } from 'next-swagger-doc';

const spec = createSwaggerSpec({
  apiFolder: 'src/app/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GitNexus Legal API',
      version: '1.0.0',
      description: 'API documentation for the Legal-as-a-Service platform',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            detail: { type: 'string', description: 'Detailed error information' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        LegalRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            workspaceId: { type: 'string', format: 'uuid' },
            matterTypeId: { type: 'string', format: 'uuid' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            status: { type: 'string' },
            customerId: { type: 'string', format: 'uuid' },
            assignedTo: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            deadline: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string' },
            title: { type: 'string' },
            role: {
              type: 'string',
              enum: ['customer', 'specialist', 'reviewer', 'coordinator_admin', 'super_admin'],
            },
            workspaceId: { type: 'string', format: 'uuid' },
            language: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        VaultFile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'integer' },
            storageKey: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/api/requests': {
        get: {
          summary: 'List requests',
          tags: ['Requests'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/LegalRequest' },
                      },
                      meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create request',
          tags: ['Requests'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LegalRequest' },
              },
            },
          },
          responses: {
            201: { description: 'Created' },
          },
        },
      },
      '/api/requests/{id}': {
        get: {
          summary: 'Get request by ID',
          tags: ['Requests'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LegalRequest' },
                },
              },
            },
          },
        },
        put: {
          summary: 'Update request',
          tags: ['Requests'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Updated' },
          },
        },
        delete: {
          summary: 'Delete request',
          tags: ['Requests'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Deleted' },
          },
        },
      },
      '/api/admin/users': {
        get: {
          summary: 'List users',
          tags: ['Admin'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'role', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' },
                      },
                      meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/workspaces': {
        get: {
          summary: 'List workspaces',
          tags: ['Workspaces'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Workspace' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create workspace',
          tags: ['Workspaces'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workspace' },
              },
            },
          },
          responses: {
            201: { description: 'Created' },
          },
        },
      },
      '/api/vault': {
        get: {
          summary: 'List vault files',
          tags: ['Vault'],
          parameters: [
            { name: 'folderId', in: 'query', schema: { type: 'string' } },
            { name: 'tagId', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/VaultFile' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/messages': {
        get: {
          summary: 'List message threads',
          tags: ['Messages'],
          parameters: [
            { name: 'requestId', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export async function GET(request: NextRequest) {
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export { spec };

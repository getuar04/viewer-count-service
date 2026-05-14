import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Viewer Count Service API',
      version: '1.0.0',
      description: 'Real-time viewer count tracking for live streams',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/streams/{streamId}/start': {
        post: {
          summary: 'Start a live stream',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'streamId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Stream started', content: { 'application/json': { schema: { type: 'object', properties: { streamId: { type: 'string' }, status: { type: 'string' } } } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/streams/{streamId}/end': {
        post: {
          summary: 'End a live stream',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'streamId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Stream ended', content: { 'application/json': { schema: { type: 'object', properties: { streamId: { type: 'string' }, status: { type: 'string' } } } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/streams/{streamId}/join': {
        post: {
          summary: 'Join a live stream',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'streamId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Joined successfully', content: { 'application/json': { schema: { type: 'object', properties: { streamId: { type: 'string' }, viewerCount: { type: 'number' } } } } } },
            400: { description: 'Stream not active' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/streams/{streamId}/leave': {
        post: {
          summary: 'Leave a live stream',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'streamId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Left successfully', content: { 'application/json': { schema: { type: 'object', properties: { streamId: { type: 'string' }, viewerCount: { type: 'number' } } } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/streams/{streamId}/heartbeat': {
        post: {
          summary: 'Send heartbeat',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'streamId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Heartbeat received' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/streams/{streamId}/viewers': {
        get: {
          summary: 'Get current viewer count',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'streamId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Viewer count', content: { 'application/json': { schema: { type: 'object', properties: { streamId: { type: 'string' }, viewerCount: { type: 'number' } } } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            200: { description: 'Healthy', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, redis: { type: 'string' } } } } } },
            503: { description: 'Unhealthy' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

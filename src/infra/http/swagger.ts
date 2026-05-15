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
          summary: 'Publish StreamStarted event to Kafka (temporary test endpoint)',
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
          summary: 'Publish StreamEnded event to Kafka (temporary test endpoint)',
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
          summary: 'Publish ViewerJoined event to Kafka',
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
          summary: 'Publish ViewerLeft event to Kafka',
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
          summary: 'Publish ViewerHeartbeat event to Kafka',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'streamId', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Heartbeat received' },
            401: { description: 'Unauthorized' },
          },
        },
      },

      '/dev/events/trigger': {
        post: {
          summary: 'Dev-only Kafka event trigger for manual testing',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'streamId'],
                  properties: {
                    type: { type: 'string', enum: ['StreamStarted', 'StreamEnded', 'ViewerJoined', 'ViewerLeft', 'ViewerHeartbeat'] },
                    streamId: { type: 'string' },
                    userId: { type: 'string' },
                    creatorId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            202: { description: 'Event published to Kafka' },
            400: { description: 'Invalid event payload' },
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

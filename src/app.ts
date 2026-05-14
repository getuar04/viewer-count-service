import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infra/http/swagger';
import viewerRoutes from './infra/http/routes/viewerRoutes';
import healthRoutes from './infra/health/healthCheck';

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(healthRoutes);
app.use(viewerRoutes);

export default app;

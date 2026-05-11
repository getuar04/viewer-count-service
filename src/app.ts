import express from 'express';
import viewerRoutes from './infra/http/routes/index';
import healthRoutes from './infra/health/healthCheck';

const app = express();
app.use(express.json());

app.use(healthRoutes);
app.use(viewerRoutes);

export default app;

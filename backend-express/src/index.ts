import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors());
app.use(express.json());

import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

import placeholderRoutes from './routes/placeholders';

// Routes
app.use('/api/Auth', authRoutes);
app.use('/api', placeholderRoutes); // Temp for client generation

app.get('/', (req, res) => {
    res.send('Musig Elgg API (Express)');
});

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});

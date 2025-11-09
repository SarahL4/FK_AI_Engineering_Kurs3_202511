import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import solution1Routes from './src/solution1/routes/api.js';
import solution2Routes from './src/solution2/routes/api.js';

// Load environment variables
dotenv.config();

// Get __dirname (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'src/public')));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));

// API routes
app.use('/api/solution1', solution1Routes);
app.use('/api/solution2', solution2Routes);

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development',
	});
});

// Home route
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Route ${req.url} not found`,
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Server error:', err);
	res.status(err.status || 500).json({
		error: err.message || 'Internal Server Error',
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`✅ Solution 1: OpenAI (gpt-4o-mini - cheapest option)`);
	console.log(`✅ Solution 2: Langchain + Gemini (free) with OpenAI fallback`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully...');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('SIGINT received, shutting down gracefully...');
	process.exit(0);
});

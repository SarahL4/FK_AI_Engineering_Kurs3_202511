import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入路由
import solution1Routes from './src/solution1/routes/api.js';

// 加载环境变量
dotenv.config();

// 获取 __dirname (ES模块中需要)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'src/public')));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));

// API 路由
app.use('/api/solution1', solution1Routes);

// 健康检查端点
app.get('/health', (req, res) => {
	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development',
	});
});

// 首页路由
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// 404 处理
app.use((req, res) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Route ${req.url} not found`,
	});
});

// 错误处理中间件
app.use((err, req, res, next) => {
	console.error('Server error:', err);
	res.status(err.status || 500).json({
		error: err.message || 'Internal Server Error',
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
	});
});

// 启动服务器
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`💰 Using OpenAI model: gpt-4o-mini (cheapest option)`);
});

// 优雅关闭
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully...');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('SIGINT received, shutting down gracefully...');
	process.exit(0);
});

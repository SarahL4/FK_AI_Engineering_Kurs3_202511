// OpenAI模型配置 - 使用最便宜的模型
export const OPENAI_MODELS = {
	// 最便宜的模型（推荐使用）
	CHEAPEST: 'gpt-4o-mini',

	// 其他可用模型（仅作参考，不推荐使用以节省成本）
	// GPT_4O: 'gpt-4o',
	// GPT_35_TURBO: 'gpt-3.5-turbo',
};

// Google Gemini模型配置
export const GEMINI_MODELS = {
	// 免费模型
	FLASH: 'gemini-2.0-flash-exp',
	PRO: 'gemini-1.5-pro',
};

// 模型成本信息（用于日志记录）
export const MODEL_COSTS = {
	'gpt-4o-mini': {
		provider: 'OpenAI',
		cost: 'paid',
		inputPrice: '$0.15 / 1M tokens',
		outputPrice: '$0.60 / 1M tokens',
		note: '最便宜的OpenAI模型',
	},
	'gemini-2.0-flash-exp': {
		provider: 'Google',
		cost: 'free',
		note: '免费模型',
	},
	'gemini-1.5-pro': {
		provider: 'Google',
		cost: 'free',
		note: '免费模型',
	},
};

// API端点配置
export const API_ENDPOINTS = {
	SOLUTION1: {
		UPLOAD: '/api/solution1/upload',
		QUERY: '/api/solution1/query',
		HISTORY: '/api/solution1/history',
	},
	SOLUTION2: {
		QUERY: '/api/solution2/query',
		HISTORY: '/api/solution2/history',
		USAGE: '/api/solution2/usage',
	},
};

// 文件上传配置
export const UPLOAD_CONFIG = {
	MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
	ALLOWED_MIME_TYPES: ['application/pdf'],
	UPLOAD_DIR: 'uploads/',
};

// 服务器配置
export const SERVER_CONFIG = {
	PORT: process.env.PORT || 3000,
	CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

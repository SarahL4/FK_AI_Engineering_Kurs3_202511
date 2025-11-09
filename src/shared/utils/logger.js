/**
 * 日志工具类
 */
export class Logger {
	/**
	 * 记录信息日志
	 * @param {string} message - 日志消息
	 * @param {Object} data - 附加数据
	 */
	static info(message, data = null) {
		const timestamp = new Date().toISOString();
		console.log(`ℹ️ [${timestamp}] ${message}`);
		if (data) {
			console.log('   数据:', data);
		}
	}

	/**
	 * 记录成功日志
	 * @param {string} message - 日志消息
	 * @param {Object} data - 附加数据
	 */
	static success(message, data = null) {
		const timestamp = new Date().toISOString();
		console.log(`✅ [${timestamp}] ${message}`);
		if (data) {
			console.log('   数据:', data);
		}
	}

	/**
	 * 记录警告日志
	 * @param {string} message - 日志消息
	 * @param {Object} data - 附加数据
	 */
	static warn(message, data = null) {
		const timestamp = new Date().toISOString();
		console.warn(`⚠️ [${timestamp}] ${message}`);
		if (data) {
			console.warn('   数据:', data);
		}
	}

	/**
	 * 记录错误日志
	 * @param {string} message - 日志消息
	 * @param {Error} error - 错误对象
	 * @param {Object} context - 上下文信息
	 */
	static error(message, error = null, context = null) {
		const timestamp = new Date().toISOString();
		console.error(`❌ [${timestamp}] ${message}`);
		if (error) {
			console.error('   错误:', error.message);
			if (error.stack && process.env.NODE_ENV === 'development') {
				console.error('   堆栈:', error.stack);
			}
		}
		if (context) {
			console.error('   上下文:', context);
		}
	}

	/**
	 * 记录调试日志（仅在开发环境）
	 * @param {string} message - 日志消息
	 * @param {Object} data - 附加数据
	 */
	static debug(message, data = null) {
		if (process.env.NODE_ENV === 'development') {
			const timestamp = new Date().toISOString();
			console.log(`🔍 [${timestamp}] ${message}`);
			if (data) {
				console.log('   数据:', data);
			}
		}
	}

	/**
	 * 记录API调用日志
	 * @param {string} method - HTTP方法
	 * @param {string} endpoint - API端点
	 * @param {number} statusCode - 状态码
	 * @param {number} duration - 持续时间（毫秒）
	 */
	static api(method, endpoint, statusCode, duration) {
		const timestamp = new Date().toISOString();
		const emoji = statusCode >= 200 && statusCode < 300 ? '✅' : '❌';
		console.log(
			`${emoji} [${timestamp}] ${method} ${endpoint} - ${statusCode} (${duration}ms)`
		);
	}

	/**
	 * 记录成本日志
	 * @param {string} model - 模型名称
	 * @param {Object} usage - Token使用情况
	 * @param {number} cost - 成本
	 */
	static cost(model, usage, cost) {
		const timestamp = new Date().toISOString();
		console.log(`💰 [${timestamp}] 模型: ${model}`);
		console.log(
			`   Token使用: ${usage.input_tokens} 输入 + ${usage.output_tokens} 输出 = ${usage.total_tokens} 总计`
		);
		console.log(`   预估成本: $${cost.toFixed(6)}`);
	}
}

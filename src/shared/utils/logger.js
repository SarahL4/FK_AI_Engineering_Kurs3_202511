/**
 * Logger Utility Class
 */
export class Logger {
	/**
	 * Log information message
	 * @param {string} message - Log message
	 * @param {Object} data - Additional data
	 */
	static info(message, data = null) {
		const timestamp = new Date().toISOString();
		console.log(`ℹ️ [${timestamp}] ${message}`);
		if (data) {
			console.log('   Data:', data);
		}
	}

	/**
	 * Log success message
	 * @param {string} message - Log message
	 * @param {Object} data - Additional data
	 */
	static success(message, data = null) {
		const timestamp = new Date().toISOString();
		console.log(`✅ [${timestamp}] ${message}`);
		if (data) {
			console.log('   Data:', data);
		}
	}

	/**
	 * Log warning message
	 * @param {string} message - Log message
	 * @param {Object} data - Additional data
	 */
	static warn(message, data = null) {
		const timestamp = new Date().toISOString();
		console.warn(`⚠️ [${timestamp}] ${message}`);
		if (data) {
			console.warn('   Data:', data);
		}
	}

	/**
	 * Log error message
	 * @param {string} message - Log message
	 * @param {Error} error - Error object
	 * @param {Object} context - Context information
	 */
	static error(message, error = null, context = null) {
		const timestamp = new Date().toISOString();
		console.error(`❌ [${timestamp}] ${message}`);
		if (error) {
			console.error('   Error:', error.message);
			if (error.stack && process.env.NODE_ENV === 'development') {
				console.error('   Stack:', error.stack);
			}
		}
		if (context) {
			console.error('   Context:', context);
		}
	}

	/**
	 * Log debug message (development only)
	 * @param {string} message - Log message
	 * @param {Object} data - Additional data
	 */
	static debug(message, data = null) {
		if (process.env.NODE_ENV === 'development') {
			const timestamp = new Date().toISOString();
			console.log(`🔍 [${timestamp}] ${message}`);
			if (data) {
				console.log('   Data:', data);
			}
		}
	}

	/**
	 * Log API call
	 * @param {string} method - HTTP method
	 * @param {string} endpoint - API endpoint
	 * @param {number} statusCode - Status code
	 * @param {number} duration - Duration (milliseconds)
	 */
	static api(method, endpoint, statusCode, duration) {
		const timestamp = new Date().toISOString();
		const emoji = statusCode >= 200 && statusCode < 300 ? '✅' : '❌';
		console.log(
			`${emoji} [${timestamp}] ${method} ${endpoint} - ${statusCode} (${duration}ms)`
		);
	}

	/**
	 * Log cost information
	 * @param {string} model - Model name
	 * @param {Object} usage - Token usage
	 * @param {number} cost - Cost
	 */
	static cost(model, usage, cost) {
		const timestamp = new Date().toISOString();
		console.log(`💰 [${timestamp}] Model: ${model}`);
		console.log(
			`   Token Usage: ${usage.input_tokens} input + ${usage.output_tokens} output = ${usage.total_tokens} total`
		);
		console.log(`   Estimated Cost: $${cost.toFixed(6)}`);
	}
}

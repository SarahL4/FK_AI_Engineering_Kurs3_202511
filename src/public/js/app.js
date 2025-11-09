// 全局状态
const state = {
	vectorStoreId: null,
	threadId: 'user-session-' + Date.now(),
	isUploading: false,
	isQuerying: false,
};

// DOM 元素
const elements = {
	pdfUpload: document.getElementById('pdfUpload'),
	fileName: document.getElementById('fileName'),
	uploadBtn: document.getElementById('uploadBtn'),
	uploadProgress: document.getElementById('uploadProgress'),
	uploadSuccess: document.getElementById('uploadSuccess'),
	uploadError: document.getElementById('uploadError'),
	queryInput: document.getElementById('queryInput'),
	submitBtn: document.getElementById('submitBtn'),
	resultsContainer: document.getElementById('resultsContainer'),
	fileAnswer: document.getElementById('fileAnswer'),
	webAnswer: document.getElementById('webAnswer'),
	usageStats: document.getElementById('usageStats'),
	inputTokens: document.getElementById('inputTokens'),
	outputTokens: document.getElementById('outputTokens'),
	estimatedCost: document.getElementById('estimatedCost'),
	historyContainer: document.getElementById('historyContainer'),
	historyList: document.getElementById('historyList'),
	clearHistoryBtn: document.getElementById('clearHistoryBtn'),
	vectorStoreStatus: document.getElementById('vectorStoreStatus'),
	loadingOverlay: document.getElementById('loadingOverlay'),
	loadingText: document.getElementById('loadingText'),
};

// 工具函数
function showLoading(text = '处理中...') {
	elements.loadingText.textContent = text;
	elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
	elements.loadingOverlay.classList.add('hidden');
}

function showError(message, elementId = null) {
	if (elementId) {
		const errorElement = document.getElementById(elementId);
		if (errorElement) {
			errorElement.querySelector('p').textContent = `❌ ${message}`;
			errorElement.classList.remove('hidden');
			setTimeout(() => {
				errorElement.classList.add('hidden');
			}, 5000);
		}
	} else {
		alert(message);
	}
}

function formatMarkdown(text) {
	if (!text) return '';
	// 简单的 Markdown 格式化
	return text
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		.replace(/\n/g, '<br>')
		.replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>');
}

// PDF 上传处理
elements.pdfUpload.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if (file) {
		if (file.type !== 'application/pdf') {
			showError('只能上传PDF文件', 'uploadError');
			elements.pdfUpload.value = '';
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			showError('文件大小不能超过10MB', 'uploadError');
			elements.pdfUpload.value = '';
			return;
		}

		elements.fileName.textContent = file.name;
		elements.uploadBtn.classList.remove('hidden');
		elements.uploadSuccess.classList.add('hidden');
		elements.uploadError.classList.add('hidden');
	}
});

elements.uploadBtn.addEventListener('click', async () => {
	const file = elements.pdfUpload.files[0];
	if (!file || state.isUploading) return;

	state.isUploading = true;
	elements.uploadBtn.disabled = true;
	elements.uploadProgress.classList.remove('hidden');
	elements.uploadSuccess.classList.add('hidden');
	elements.uploadError.classList.add('hidden');

	try {
		const formData = new FormData();
		formData.append('pdf', file);

		const response = await fetch('/api/solution1/upload', {
			method: 'POST',
			body: formData,
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Upload failed');
		}

		if (data.success) {
			state.vectorStoreId = data.vectorStoreId;
			elements.uploadSuccess.classList.remove('hidden');
			elements.uploadProgress.classList.add('hidden');
			elements.uploadBtn.classList.add('hidden');

			// 更新状态显示
			elements.vectorStoreStatus.textContent = `已上传: ${data.fileName} (${data.vectorStoreId})`;
			elements.vectorStoreStatus.classList.add('text-success-800');

			// 启用查询功能
			elements.queryInput.disabled = false;
			elements.submitBtn.disabled = false;
			elements.queryInput.placeholder = '请输入您的问题...';
			elements.queryInput.nextElementSibling.textContent =
				'已就绪，可以开始提问';

			console.log('✅ 文件上传成功:', data);
		}
	} catch (error) {
		console.error('❌ 上传失败:', error);
		showError(error.message, 'uploadError');
		elements.uploadProgress.classList.add('hidden');
	} finally {
		state.isUploading = false;
		elements.uploadBtn.disabled = false;
	}
});

// 查询处理
elements.submitBtn.addEventListener('click', async () => {
	const query = elements.queryInput.value.trim();

	// 验证输入
	if (!query) {
		showError('请输入问题');
		elements.queryInput.focus();
		return;
	}

	if (query.length > 1000) {
		showError('问题太长，最多1000个字符');
		return;
	}

	if (!state.vectorStoreId) {
		showError('请先上传PDF文件');
		return;
	}

	if (state.isQuerying) {
		console.log('⏳ 已有查询正在进行中...');
		return;
	}

	state.isQuerying = true;
	elements.submitBtn.disabled = true;
	showLoading('正在查询...');

	// 显示结果容器
	elements.resultsContainer.classList.remove('hidden');

	// 重置结果显示
	elements.fileAnswer.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500">
			<div class="loading-spinner"></div>
			<span>正在搜索文件...</span>
		</div>
	`;
	elements.webAnswer.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500">
			<div class="loading-spinner"></div>
			<span>正在搜索网络...</span>
		</div>
	`;

	try {
		const response = await fetch('/api/solution1/query', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: query,
				vectorStoreId: state.vectorStoreId,
				threadId: state.threadId,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Query failed');
		}

		if (data.success) {
			// 显示文件搜索结果
			elements.fileAnswer.innerHTML = `
				<div class="prose max-w-none fade-in">
					<p class="text-gray-800 whitespace-pre-wrap">${formatMarkdown(
						data.fileAnswer
					)}</p>
				</div>
			`;

			// 显示网络搜索结果
			elements.webAnswer.innerHTML = `
				<div class="prose max-w-none fade-in">
					<p class="text-gray-800 whitespace-pre-wrap">${formatMarkdown(
						data.webAnswer
					)}</p>
				</div>
			`;

			// 显示 Token 使用统计
			if (data.usage) {
				elements.inputTokens.textContent = `${data.usage.input_tokens.toLocaleString()} tokens`;
				elements.outputTokens.textContent = `${data.usage.output_tokens.toLocaleString()} tokens`;
				elements.estimatedCost.textContent = `$${data.usage.estimated_cost.toFixed(
					6
				)}`;
			}

			// 清空输入框
			elements.queryInput.value = '';

			// 加载历史记录
			await loadHistory();

			console.log('✅ 查询成功:', data);
		}
	} catch (error) {
		console.error('❌ 查询失败:', error);
		elements.fileAnswer.innerHTML = `
			<div class="text-red-800 bg-red-50 p-3 rounded">
				❌ 查询失败: ${error.message}
			</div>
		`;
		elements.webAnswer.innerHTML = `
			<div class="text-red-800 bg-red-50 p-3 rounded">
				❌ 查询失败: ${error.message}
			</div>
		`;
	} finally {
		state.isQuerying = false;
		elements.submitBtn.disabled = false;
		hideLoading();
	}
});

// Enter 键提交
elements.queryInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter' && e.ctrlKey) {
		elements.submitBtn.click();
	}
});

// 实时字符计数
elements.queryInput.addEventListener('input', (e) => {
	const length = e.target.value.length;
	const maxLength = 1000;

	// 如果还没有字符计数元素，创建一个
	if (!document.getElementById('charCount')) {
		const charCountEl = document.createElement('p');
		charCountEl.id = 'charCount';
		charCountEl.className = 'text-xs text-gray-500 mt-1';
		e.target.parentNode.appendChild(charCountEl);
	}

	const charCountEl = document.getElementById('charCount');
	charCountEl.textContent = `${length} / ${maxLength} 字符`;

	// 如果接近限制，改变颜色
	if (length > maxLength * 0.9) {
		charCountEl.className = 'text-xs text-warning-800 mt-1';
	} else if (length > maxLength) {
		charCountEl.className = 'text-xs text-red-800 mt-1 font-semibold';
	} else {
		charCountEl.className = 'text-xs text-gray-500 mt-1';
	}
});

// 加载历史记录
async function loadHistory() {
	try {
		const response = await fetch(
			`/api/solution1/history/${state.threadId}?limit=10`
		);
		const data = await response.json();

		if (data.success && data.history.length > 0) {
			elements.historyContainer.classList.remove('hidden');

			elements.historyList.innerHTML = data.history
				.reverse()
				.map(
					(item, index) => `
				<div class="mb-4 p-3 bg-white rounded border border-gray-200 fade-in">
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs text-gray-500">${new Date(item.timestamp).toLocaleString(
							'sv-SE'
						)}</span>
						<span class="text-xs text-gray-500">
							${item.usage ? `${item.usage.total_tokens} tokens` : ''}
						</span>
					</div>
					<div class="mb-2">
						<p class="text-sm font-semibold text-gray-900">问题:</p>
						<p class="text-sm text-gray-700">${item.query}</p>
					</div>
					<div class="mb-2">
						<p class="text-xs font-semibold text-blue-900">文件搜索:</p>
						<p class="text-xs text-gray-600 line-clamp-2">${item.fileAnswer.substring(
							0,
							100
						)}...</p>
					</div>
					<div>
						<p class="text-xs font-semibold text-green-900">网络搜索:</p>
						<p class="text-xs text-gray-600 line-clamp-2">${item.webAnswer.substring(
							0,
							100
						)}...</p>
					</div>
				</div>
			`
				)
				.join('');
		}
	} catch (error) {
		console.error('❌ 加载历史失败:', error);
	}
}

// 清除历史
elements.clearHistoryBtn.addEventListener('click', async () => {
	if (!confirm('确定要清除对话历史吗？')) return;

	try {
		const response = await fetch(`/api/solution1/history/${state.threadId}`, {
			method: 'DELETE',
		});

		const data = await response.json();

		if (data.success) {
			elements.historyList.innerHTML = `
				<p class="text-gray-500 text-center text-sm">暂无对话历史</p>
			`;
			elements.historyContainer.classList.add('hidden');
			console.log('✅ 历史已清除');
		}
	} catch (error) {
		console.error('❌ 清除历史失败:', error);
		alert('清除历史失败: ' + error.message);
	}
});

// 初始化
console.log('🚀 Försäkringskassan AI助手已启动');
console.log('📝 Session ID:', state.threadId);
console.log('💰 使用模型: gpt-4o-mini (OpenAI最便宜的模型)');

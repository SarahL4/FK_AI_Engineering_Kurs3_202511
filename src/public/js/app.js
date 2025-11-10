// Global state
const state = {
	vectorStoreId: null,
	threadId1: 'openai-session-' + Date.now(),
	threadId2: 'langchain-session-' + Date.now(),
	isQuerying: false,
};

// DOM elements
const elements = {
	queryInput: document.getElementById('queryInput'),
	submitBtn1: document.getElementById('submitBtn1'),
	submitBtn2: document.getElementById('submitBtn2'),
	submitBtnBoth: document.getElementById('submitBtnBoth'),

	// History controls
	showHistoryBtn: document.getElementById('showHistoryBtn'),
	clearHistoryBtn: document.getElementById('clearHistoryBtn'),
	hideHistoryBtn: document.getElementById('hideHistoryBtn'),
	historyPanel: document.getElementById('historyPanel'),
	historyContent: document.getElementById('historyContent'),
	historyEmpty: document.getElementById('historyEmpty'),
	totalCost: document.getElementById('totalCost'),

	// Solution 1 container and elements
	solution1Container: document.getElementById('solution1Container'),
	fileSearchBlock1: document.getElementById('fileSearchBlock1'),
	webSearchBlock1: document.getElementById('webSearchBlock1'),
	fileAnswer1: document.getElementById('fileAnswer1'),
	webAnswer1: document.getElementById('webAnswer1'),
	tokenUsage1: document.getElementById('tokenUsage1'),
	inputTokens1: document.getElementById('inputTokens1'),
	outputTokens1: document.getElementById('outputTokens1'),
	cost1: document.getElementById('cost1'),
	responseTime1: document.getElementById('responseTime1'),
	vectorStoreStatus1: document.getElementById('vectorStoreStatus1'),

	// Solution 2 container and elements
	solution2Container: document.getElementById('solution2Container'),
	fileSearchBlock2: document.getElementById('fileSearchBlock2'),
	webSearchBlock2: document.getElementById('webSearchBlock2'),
	fileAnswer2: document.getElementById('fileAnswer2'),
	webAnswer2: document.getElementById('webAnswer2'),
	modelBadge2: document.getElementById('modelBadge2'),
	freeLLMCount: document.getElementById('freeLLMCount'),
	paidLLMCount: document.getElementById('paidLLMCount'),
	tokenUsage2: document.getElementById('tokenUsage2'),
	inputTokens2: document.getElementById('inputTokens2'),
	outputTokens2: document.getElementById('outputTokens2'),
	cost2: document.getElementById('cost2'),
	responseTime2: document.getElementById('responseTime2'),
	embeddingUsage2: document.getElementById('embeddingUsage2'),
	embeddingModel2: document.getElementById('embeddingModel2'),
	embeddingTokens2: document.getElementById('embeddingTokens2'),
	embeddingCostValue2: document.getElementById('embeddingCostValue2'),

	loadingOverlay: document.getElementById('loadingOverlay'),
	loadingText: document.getElementById('loadingText'),
};

// Utility functions
function showLoading(text = 'Processing...') {
	elements.loadingText.textContent = text;
	elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
	elements.loadingOverlay.classList.add('hidden');
}

function showError(message) {
	alert(message);
}

function formatMarkdown(text) {
	if (!text) return '';
	return text
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		.replace(/\n/g, '<br>')
		.replace(
			/`(.*?)`/g,
			'<code class="bg-gray-200 px-1 rounded text-xs">$1</code>'
		);
}

function formatTimestamp(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleString('sv-SE', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

// Load conversation history for Solution 1
async function loadHistory1(displayInPanel = false) {
	try {
		const response = await fetch(`/api/solution1/history/${state.threadId1}`);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Failed to load history');
		}

		if (data.success) {
			if (displayInPanel) {
				displayHistory(data);
			}
			updateTotalCost(data.summary?.totalUsage?.estimated_cost || 0);
		}
	} catch (error) {
		console.error('❌ Failed to load history:', error);
		if (displayInPanel) {
			showError('Failed to load conversation history: ' + error.message);
		}
	}
}

// Display conversation history
function displayHistory(data) {
	const { history, summary } = data;

	if (!history || history.length === 0) {
		elements.historyContent.innerHTML = '';
		elements.historyEmpty.classList.remove('hidden');
		return;
	}

	elements.historyEmpty.classList.add('hidden');

	// Create history items HTML
	const historyHTML = history
		.map(
			(item, index) => `
		<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
			<div class="flex items-start justify-between mb-2">
				<div class="flex items-center gap-2">
					<span class="text-xs font-bold text-gray-500">#${index + 1}</span>
					<span class="text-xs text-gray-500">${formatTimestamp(item.timestamp)}</span>
				</div>
				<div class="text-xs font-mono text-purple-700">
					$${(item.usage?.estimated_cost || 0).toFixed(6)}
				</div>
			</div>
			<div class="mb-3">
				<div class="text-xs font-semibold text-gray-600 mb-1">❓ Question:</div>
				<div class="text-sm text-gray-800 bg-white rounded p-2">
					${formatMarkdown(item.query)}
				</div>
			</div>
			<div class="grid md:grid-cols-2 gap-3">
				<div>
					<div class="text-xs font-semibold text-blue-600 mb-1">📄 File Answer:</div>
					<div class="text-xs text-gray-700 bg-blue-50 rounded p-2 max-h-32 overflow-y-auto">
						${formatMarkdown(item.fileAnswer)}
					</div>
				</div>
				<div>
					<div class="text-xs font-semibold text-green-600 mb-1">🌐 Web Answer:</div>
					<div class="text-xs text-gray-700 bg-green-50 rounded p-2 max-h-32 overflow-y-auto">
						${formatMarkdown(item.webAnswer)}
					</div>
				</div>
			</div>
			<div class="mt-2 flex gap-4 text-xs text-gray-500">
				<span>📊 Input: ${item.usage?.input_tokens?.toLocaleString() || 0}</span>
				<span>📊 Output: ${item.usage?.output_tokens?.toLocaleString() || 0}</span>
				<span>📊 Total: ${item.usage?.total_tokens?.toLocaleString() || 0}</span>
			</div>
		</div>
	`
		)
		.join('');

	elements.historyContent.innerHTML = historyHTML;

	// Add summary at the top
	if (summary && summary.exists) {
		const summaryHTML = `
			<div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border-2 border-purple-200">
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
					<div>
						<div class="text-xs text-gray-600">Messages</div>
						<div class="font-bold text-purple-900">${summary.messageCount}</div>
					</div>
					<div>
						<div class="text-xs text-gray-600">Total Tokens</div>
						<div class="font-bold text-purple-900">${
							summary.totalUsage?.total_tokens?.toLocaleString() || 0
						}</div>
					</div>
					<div>
						<div class="text-xs text-gray-600">Input Tokens</div>
						<div class="font-bold text-purple-900">${
							summary.totalUsage?.input_tokens?.toLocaleString() || 0
						}</div>
					</div>
					<div>
						<div class="text-xs text-gray-600">Total Cost</div>
						<div class="font-bold text-purple-900">$${(
							summary.totalUsage?.estimated_cost || 0
						).toFixed(6)}</div>
					</div>
				</div>
			</div>
		`;
		elements.historyContent.insertAdjacentHTML('afterbegin', summaryHTML);
	}
}

// Update total cost display
function updateTotalCost(cost) {
	elements.totalCost.textContent = `$${(cost || 0).toFixed(6)}`;
}

// Clear conversation history
async function clearHistory1() {
	if (!confirm('Are you sure you want to clear all conversation history?')) {
		return;
	}

	try {
		const response = await fetch(`/api/solution1/history/${state.threadId1}`, {
			method: 'DELETE',
		});
		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Failed to clear history');
		}

		if (data.success) {
			elements.historyContent.innerHTML = '';
			elements.historyEmpty.classList.remove('hidden');
			updateTotalCost(0);
			showMessage('✅ History cleared successfully!');
		}
	} catch (error) {
		console.error('❌ Failed to clear history:', error);
		showError('Failed to clear history: ' + error.message);
	}
}

function showMessage(message) {
	// Simple success message using alert (can be improved with toast notifications)
	alert(message);
}

// Load Solution 1 configuration
async function loadConfig1() {
	try {
		elements.vectorStoreStatus1.textContent = 'Loading...';

		const response = await fetch('/api/solution1/config');
		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				data.error ||
					'Failed to load config. Please ensure you have run: npm run init:vectorstore'
			);
		}

		if (data.success) {
			state.vectorStoreId = data.vectorStoreId;
			const info = data.vectorStoreInfo;
			const statusText = `✅ Ready (${info.file_counts?.completed || 0} files)`;
			elements.vectorStoreStatus1.textContent = statusText;
			console.log('✅ Solution 1 Vector Store loaded:', data);
		}
	} catch (error) {
		console.error('❌ Solution 1 config load failed:', error);
		elements.vectorStoreStatus1.textContent = `❌ Error`;
		elements.submitBtn1.disabled = true;
		elements.submitBtnBoth.disabled = true;
	}
}

// Load Solution 2 usage statistics
async function loadUsageStats2() {
	try {
		const response = await fetch('/api/solution2/usage');
		const data = await response.json();

		if (data.success) {
			elements.freeLLMCount.textContent = `${data.data.free.count} calls`;
			elements.paidLLMCount.textContent = `${data.data.paid.count} calls`;
		}
	} catch (error) {
		console.error('❌ Failed to load usage stats:', error);
	}
}

// Query Solution 1 (OpenAI)
async function querySolution1(query) {
	if (!state.vectorStoreId) {
		showError('Vector Store not loaded for Solution 1');
		return;
	}

	// Show Solution 1 container and result blocks
	elements.solution1Container.classList.remove('hidden');
	elements.fileSearchBlock1.classList.remove('hidden');
	elements.webSearchBlock1.classList.remove('hidden');

	// Reset displays
	elements.fileAnswer1.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500 py-8">
			<div class="loading-spinner"></div>
			<span>Searching files...</span>
		</div>
	`;
	elements.webAnswer1.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500 py-8">
			<div class="loading-spinner"></div>
			<span>Searching web...</span>
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
				threadId: state.threadId1,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Query failed');
		}

		if (data.success) {
			// Display file search results
			elements.fileAnswer1.innerHTML = `
				<div class="prose max-w-none fade-in">
					<p class="text-gray-800 leading-relaxed">${formatMarkdown(data.fileAnswer)}</p>
				</div>
			`;

			// Display web search results
			elements.webAnswer1.innerHTML = `
				<div class="prose max-w-none fade-in">
					<p class="text-gray-800 whitespace-pre-wrap leading-relaxed">${formatMarkdown(
						data.webAnswer
					)}</p>
				</div>
			`;

			// Display token usage
			if (data.usage) {
				elements.tokenUsage1.classList.remove('hidden');
				elements.inputTokens1.textContent = `${data.usage.input_tokens.toLocaleString()}`;
				elements.outputTokens1.textContent = `${data.usage.output_tokens.toLocaleString()}`;
				elements.cost1.textContent = `$${data.usage.estimated_cost.toFixed(6)}`;
				elements.responseTime1.textContent = `${
					data.usage.response_time
						? data.usage.response_time.toFixed(2) + 's'
						: '-'
				}`;
			}

			console.log('✅ Solution 1 query successful:', data);

			// Update total cost in background
			loadHistory1().then(() => {
				console.log('📊 Total cost updated');
			});
		}
	} catch (error) {
		console.error('❌ Solution 1 query failed:', error);
		const errorHtml = `
			<div class="text-red-800 bg-red-50 p-3 rounded">
				❌ Query failed: ${error.message}
			</div>
		`;
		elements.fileAnswer1.innerHTML = errorHtml;
		elements.webAnswer1.innerHTML = errorHtml;
	}
}

// Query Solution 2 (RAG Chain)
async function querySolution2(query) {
	// Show Solution 2 container and result blocks
	elements.solution2Container.classList.remove('hidden');
	elements.fileSearchBlock2.classList.remove('hidden');
	elements.webSearchBlock2.classList.remove('hidden');

	// Reset display
	elements.fileAnswer2.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500 py-8">
			<div class="loading-spinner"></div>
			<span>Processing with File Search + LLM...</span>
		</div>
	`;
	elements.webAnswer2.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500 py-8">
			<div class="loading-spinner"></div>
			<span>Searching web...</span>
		</div>
	`;

	try {
		const response = await fetch('/api/solution2/query', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: query,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Query failed');
		}

		if (data.success) {
			const resultData = data.data;

			// Display file search + LLM result
			if (resultData.fileSearchWithLLM) {
				const fileResult = resultData.fileSearchWithLLM;
				elements.fileAnswer2.innerHTML = `
				<div class="prose max-w-none fade-in">
					<p class="text-gray-800 leading-relaxed text-base mb-4">
						${formatMarkdown(fileResult.answer)}
					</p>${
						fileResult.sourceDocument
							? `
					<details class="mt-2">
						<summary class="cursor-pointer text-xs text-gray-600 hover:text-gray-800 font-semibold">
							📊 Source: ${fileResult.sourceDocument.source || 'FK.pdf'} 
							(from ${fileResult.totalDocuments} documents) - Click to view full text
						</summary>
						<div class="mt-2 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r max-h-96 overflow-y-auto">
							<p class="text-xs text-gray-700 whitespace-pre-wrap">${
								fileResult.sourceDocument.content
							}</p>
						</div>
					</details>`
							: ''
					}
				</div>
			`;

				// Update model badge
				const isFree = fileResult.cost === 'free';
				elements.modelBadge2.textContent = isFree ? '✅ Free' : '💰 Paid';
				elements.modelBadge2.className = `text-xs px-2 py-0.5 rounded-full ${
					isFree
						? 'bg-green-100 text-green-800'
						: 'bg-orange-100 text-orange-800'
				}`;
			} else {
				elements.fileAnswer2.innerHTML = `
					<p class="text-gray-500 text-center py-8">No file search results</p>
				`;
			}

			// Display web search result (top result only)
			if (resultData.webSearch?.topResult) {
				const topResult = resultData.webSearch.topResult;
				elements.webAnswer2.innerHTML = `
					<div class="prose max-w-none fade-in">
						<p class="text-xs text-gray-500 mb-3">
							🌐 Top result (from ${resultData.webSearch.totalResults} results)
						</p>
						<div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
							<p class="font-semibold text-base text-gray-900 mb-2">${topResult.title}</p>
							<a href="${topResult.url}" target="_blank" class="text-sm text-blue-600 hover:underline block mb-3">
								${topResult.url}
							</a>
							<p class="text-gray-800 text-sm leading-relaxed">${topResult.content}</p>
						</div>
					</div>
				`;
			} else {
				elements.webAnswer2.innerHTML = `
					<p class="text-gray-500 text-center py-8">No web results</p>
				`;
			}

			// Update usage statistics
			if (resultData.stats) {
				elements.freeLLMCount.textContent = `${resultData.stats.freeCount} calls`;
				elements.paidLLMCount.textContent = `${resultData.stats.paidCount} calls`;
			}

			// Show token usage if available (LLM)
			if (resultData.usage) {
				elements.tokenUsage2.classList.remove('hidden');
				elements.inputTokens2.textContent = resultData.usage.inputTokens || '-';
				elements.outputTokens2.textContent =
					resultData.usage.outputTokens || '-';
				elements.cost2.textContent = resultData.usage.cost || '$0.00';
			}

			// Show response time
			if (resultData.responseTime) {
				elements.responseTime2.textContent = `${resultData.responseTime.toFixed(
					2
				)}s`;
			}

			// Show embedding token usage if available (OpenAI Embeddings)
			console.log('🔍 Checking embeddingCost:', resultData.embeddingCost);
			if (resultData.embeddingCost) {
				console.log('✅ Displaying embedding usage');
				elements.embeddingUsage2.classList.remove('hidden');
				elements.embeddingModel2.textContent =
					resultData.embeddingCost.model || '-';
				elements.embeddingTokens2.textContent =
					resultData.embeddingCost.tokens || '-';
				elements.embeddingCostValue2.textContent =
					resultData.embeddingCost.cost || '$0.00';
			} else {
				console.warn('⚠️ No embeddingCost data received');
			}

			console.log('✅ Solution 2 query successful:', data);
		}
	} catch (error) {
		console.error('❌ Solution 2 query failed:', error);
		const errorMessage = `
			<div class="text-red-800 bg-red-50 p-3 rounded">
				❌ Query failed: ${error.message}
			</div>
		`;
		elements.fileAnswer2.innerHTML = errorMessage;
		elements.webAnswer2.innerHTML = errorMessage;
	}
}

// Event Listeners
elements.submitBtn1.addEventListener('click', async () => {
	const query = elements.queryInput.value.trim();

	if (!query) {
		showError('Please enter a question');
		elements.queryInput.focus();
		return;
	}

	if (query.length > 1000) {
		showError('Question too long, maximum 1000 characters');
		return;
	}

	if (state.isQuerying) {
		return;
	}

	state.isQuerying = true;
	elements.submitBtn1.disabled = true;
	elements.submitBtn2.disabled = true;
	elements.submitBtnBoth.disabled = true;
	showLoading('Querying Solution 1 (OpenAI)...');

	try {
		await querySolution1(query);
	} finally {
		state.isQuerying = false;
		elements.submitBtn1.disabled = false;
		elements.submitBtn2.disabled = false;
		elements.submitBtnBoth.disabled = false;
		hideLoading();
	}
});

elements.submitBtn2.addEventListener('click', async () => {
	const query = elements.queryInput.value.trim();

	if (!query) {
		showError('Please enter a question');
		elements.queryInput.focus();
		return;
	}

	if (query.length > 1000) {
		showError('Question too long, maximum 1000 characters');
		return;
	}

	if (state.isQuerying) {
		return;
	}

	state.isQuerying = true;
	elements.submitBtn1.disabled = true;
	elements.submitBtn2.disabled = true;
	elements.submitBtnBoth.disabled = true;
	showLoading('Querying Solution 2 (Langchain)...');

	try {
		await querySolution2(query);
	} finally {
		state.isQuerying = false;
		elements.submitBtn1.disabled = false;
		elements.submitBtn2.disabled = false;
		elements.submitBtnBoth.disabled = false;
		hideLoading();
	}
});

elements.submitBtnBoth.addEventListener('click', async () => {
	const query = elements.queryInput.value.trim();

	if (!query) {
		showError('Please enter a question');
		elements.queryInput.focus();
		return;
	}

	if (query.length > 1000) {
		showError('Question too long, maximum 1000 characters');
		return;
	}

	if (state.isQuerying) {
		return;
	}

	state.isQuerying = true;
	elements.submitBtn1.disabled = true;
	elements.submitBtn2.disabled = true;
	elements.submitBtnBoth.disabled = true;
	showLoading('Querying both solutions...');

	try {
		// Query both in parallel
		await Promise.all([querySolution1(query), querySolution2(query)]);
	} finally {
		state.isQuerying = false;
		elements.submitBtn1.disabled = false;
		elements.submitBtn2.disabled = false;
		elements.submitBtnBoth.disabled = false;
		hideLoading();
	}
});

// Submit with Enter key
elements.queryInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter' && e.ctrlKey) {
		elements.submitBtnBoth.click();
	}
});

// Real-time character count
elements.queryInput.addEventListener('input', (e) => {
	const length = e.target.value.length;
	const maxLength = 1000;

	let charCountEl = document.getElementById('charCount');
	if (!charCountEl) {
		charCountEl = document.createElement('p');
		charCountEl.id = 'charCount';
		charCountEl.className = 'text-xs text-gray-500 mt-1';
		e.target.parentNode.appendChild(charCountEl);
	}

	charCountEl.textContent = `${length} / ${maxLength} characters`;

	if (length > maxLength * 0.9) {
		charCountEl.className = 'text-xs text-warning-800 mt-1';
	} else if (length > maxLength) {
		charCountEl.className = 'text-xs text-red-800 mt-1 font-semibold';
	} else {
		charCountEl.className = 'text-xs text-gray-500 mt-1';
	}
});

// History controls event listeners
elements.showHistoryBtn.addEventListener('click', async () => {
	elements.historyPanel.classList.remove('hidden');
	await loadHistory1(true);
});

elements.hideHistoryBtn.addEventListener('click', () => {
	elements.historyPanel.classList.add('hidden');
});

elements.clearHistoryBtn.addEventListener('click', async () => {
	await clearHistory1();
});

// Initialize
console.log('🚀 Försäkringskassan AI Assistant started');
console.log('📝 Session IDs:');
console.log('   Solution 1 (OpenAI):', state.threadId1);
console.log('   Solution 2 (Langchain):', state.threadId2);
console.log('💰 Cost optimization:');
console.log('   Solution 1: gpt-4o-mini (OpenAI cheapest model)');
console.log('   Solution 2: Gemini 2.0 Flash (Free) with OpenAI fallback');

// Load configurations
loadConfig1();
loadUsageStats2();

// Refresh usage stats every 10 seconds
setInterval(loadUsageStats2, 10000);

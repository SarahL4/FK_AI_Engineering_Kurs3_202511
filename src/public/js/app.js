// Global state
const state = {
	vectorStoreId: null,
	threadId: 'user-session-' + Date.now(),
	isQuerying: false,
};

// DOM elements
const elements = {
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
	heroVectorStatus: document.getElementById('heroVectorStatus'),
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
	// Simple Markdown formatting
	return text
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		.replace(/\n/g, '<br>')
		.replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>');
}

// Load configuration and Vector Store ID
async function loadConfig() {
	try {
		elements.vectorStoreStatus.textContent = 'Loading...';
		if (elements.heroVectorStatus) {
			elements.heroVectorStatus.textContent = 'Loading...';
		}

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

			// Update status display
			const info = data.vectorStoreInfo;
			const statusText = `✅ Loaded (${
				info.file_counts?.completed || 0
			} files)`;
			elements.vectorStoreStatus.textContent = statusText;

			// Update hero status
			if (elements.heroVectorStatus) {
				elements.heroVectorStatus.textContent = '✅ Ready';
			}

			console.log('✅ Vector Store loaded:', data);
			console.log('📌 Vector Store ID:', state.vectorStoreId);
		}
	} catch (error) {
		console.error('❌ Failed to load config:', error);
		elements.vectorStoreStatus.textContent = `❌ Error`;
		elements.vectorStoreStatus.classList.add('text-red-800');

		if (elements.heroVectorStatus) {
			elements.heroVectorStatus.textContent = '❌ Error';
		}

		elements.queryInput.disabled = true;
		elements.submitBtn.disabled = true;

		showError(
			`Failed to load config: ${error.message}. Please run: npm run init:vectorstore`
		);
	}
}

// Query handling
elements.submitBtn.addEventListener('click', async () => {
	const query = elements.queryInput.value.trim();

	// Validate input
	if (!query) {
		showError('Please enter a question');
		elements.queryInput.focus();
		return;
	}

	if (query.length > 1000) {
		showError('Question too long, maximum 1000 characters');
		return;
	}

	if (!state.vectorStoreId) {
		showError('Vector Store not loaded, please refresh the page');
		return;
	}

	if (state.isQuerying) {
		console.log('⏳ Query already in progress...');
		return;
	}

	state.isQuerying = true;
	elements.submitBtn.disabled = true;
	showLoading('Querying...');

	// Show results container
	elements.resultsContainer.classList.remove('hidden');

	// Reset result displays
	elements.fileAnswer.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500">
			<div class="loading-spinner"></div>
			<span>Searching files...</span>
		</div>
	`;
	elements.webAnswer.innerHTML = `
		<div class="flex items-center justify-center gap-2 text-gray-500">
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
				threadId: state.threadId,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Query failed');
		}

		if (data.success) {
			// Display file search results
			elements.fileAnswer.innerHTML = `
				<div class="prose max-w-none fade-in">
					<p class="text-gray-800 whitespace-pre-wrap">${formatMarkdown(
						data.fileAnswer
					)}</p>
				</div>
			`;

			// Display web search results
			elements.webAnswer.innerHTML = `
				<div class="prose max-w-none fade-in">
					<p class="text-gray-800 whitespace-pre-wrap">${formatMarkdown(
						data.webAnswer
					)}</p>
				</div>
			`;

			// Display token usage statistics
			if (data.usage) {
				elements.inputTokens.textContent = `${data.usage.input_tokens.toLocaleString()} tokens`;
				elements.outputTokens.textContent = `${data.usage.output_tokens.toLocaleString()} tokens`;
				elements.estimatedCost.textContent = `$${data.usage.estimated_cost.toFixed(
					6
				)}`;
			}

			// Clear input field
			elements.queryInput.value = '';

			// Load history
			await loadHistory();

			console.log('✅ Query successful:', data);
		}
	} catch (error) {
		console.error('❌ Query failed:', error);
		elements.fileAnswer.innerHTML = `
			<div class="text-red-800 bg-red-50 p-3 rounded">
				❌ Query failed: ${error.message}
			</div>
		`;
		elements.webAnswer.innerHTML = `
			<div class="text-red-800 bg-red-50 p-3 rounded">
				❌ Query failed: ${error.message}
			</div>
		`;
	} finally {
		state.isQuerying = false;
		elements.submitBtn.disabled = false;
		hideLoading();
	}
});

// Submit with Enter key
elements.queryInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter' && e.ctrlKey) {
		elements.submitBtn.click();
	}
});

// Real-time character count
elements.queryInput.addEventListener('input', (e) => {
	const length = e.target.value.length;
	const maxLength = 1000;

	// If character count element doesn't exist, create one
	if (!document.getElementById('charCount')) {
		const charCountEl = document.createElement('p');
		charCountEl.id = 'charCount';
		charCountEl.className = 'text-xs text-gray-500 mt-1';
		e.target.parentNode.appendChild(charCountEl);
	}

	const charCountEl = document.getElementById('charCount');
	charCountEl.textContent = `${length} / ${maxLength} characters`;

	// Change color if approaching limit
	if (length > maxLength * 0.9) {
		charCountEl.className = 'text-xs text-warning-800 mt-1';
	} else if (length > maxLength) {
		charCountEl.className = 'text-xs text-red-800 mt-1 font-semibold';
	} else {
		charCountEl.className = 'text-xs text-gray-500 mt-1';
	}
});

// Load conversation history
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
						<p class="text-sm font-semibold text-gray-900">Question:</p>
						<p class="text-sm text-gray-700">${item.query}</p>
					</div>
					<div class="mb-2">
						<p class="text-xs font-semibold text-blue-900">File Search:</p>
						<p class="text-xs text-gray-600 line-clamp-2">${item.fileAnswer.substring(
							0,
							100
						)}...</p>
					</div>
					<div>
						<p class="text-xs font-semibold text-green-900">Web Search:</p>
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
		console.error('❌ Failed to load history:', error);
	}
}

// Clear history
elements.clearHistoryBtn.addEventListener('click', async () => {
	if (!confirm('Are you sure you want to clear the conversation history?'))
		return;

	try {
		const response = await fetch(`/api/solution1/history/${state.threadId}`, {
			method: 'DELETE',
		});

		const data = await response.json();

		if (data.success) {
			elements.historyList.innerHTML = `
				<p class="text-gray-500 text-center text-sm">No conversation history</p>
			`;
			elements.historyContainer.classList.add('hidden');
			console.log('✅ History cleared');
		}
	} catch (error) {
		console.error('❌ Failed to clear history:', error);
		alert('Failed to clear history: ' + error.message);
	}
});

// Initialize
console.log('🚀 Försäkringskassan AI Assistant started');
console.log('📝 Session ID:', state.threadId);
console.log('💰 Using model: gpt-4o-mini (OpenAI cheapest model)');

// Load configuration
loadConfig();

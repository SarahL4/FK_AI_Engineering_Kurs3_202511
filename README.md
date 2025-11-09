# Försäkringskassan AI Assistant - Solution 1: OpenAI Agent SDK

An intelligent Q&A system based on OpenAI Responses API and Agent SDK, designed to answer questions about Swedish föräldrarpenning (parental allowance) and barn (children).

## ✨ Features

- 📄 **Pre-loaded PDF**: PDF document pre-uploaded to OpenAI Vector Store for instant access
- 🔍 **File Search**: Uses OpenAI's file_search tool to search information in the uploaded document
- 🌐 **Web Search**: Uses OpenAI's built-in web_search_preview tool for real-time web searches
- 💾 **Conversation Memory**: Automatically maintains conversation context for more accurate answers
- 💰 **Cost Optimized**: Uses gpt-4o-mini (OpenAI's cheapest model)
- 📊 **Usage Statistics**: Real-time display of token usage and estimated costs
- 🎨 **Modern UI**: Responsive interface built with Tailwind CSS

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file (refer to `.env.example`):

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Vector Store ID (Required - generated in step 3)
VECTOR_STORE_ID=your_vector_store_id_here

# Server Configuration (Optional)
PORT=3000
NODE_ENV=development
OPENAI_MODEL=gpt-4o-mini
```

### 3. Initialize Vector Store (First Time Only)

Upload the PDF document to OpenAI Vector Store:

```bash
npm run init:vectorstore
```

This will:

- Upload `src/assets/FK.pdf` to OpenAI
- Create a Vector Store
- Attach the file to the Vector Store
- Output a `VECTOR_STORE_ID` that you need to add to your `.env` file

**Important**: Copy the `VECTOR_STORE_ID` from the output and add it to your `.env` file.

### 4. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

### 5. Access the Application

Open your browser and visit: [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Ask Questions

1. Open the application in your browser
2. The Vector Store is automatically loaded on page load
3. Enter your question in the text box
   - Example: "Hur många dagar med föräldrapenning kan man få?"
4. Click "Submit Question and Search"
5. The system will simultaneously execute:
   - **File Search**: Searches for relevant information in the pre-loaded PDF
   - **Web Search**: Searches the internet for the latest information

### View Results

- View both file search and web search results side by side
- Check token usage statistics and estimated costs
- Browse conversation history
- Clear conversation history if needed

### Sample Questions

```
Hur många dagar med föräldrapenning kan man få?
Om jag har två barn, hur mycket får barnbidrag?
Vad är reglerna för föräldraledighet?
```

## 🏗️ Project Structure

```
FK_JL_Kurs3_202511/
├── scripts/
│   └── init-vector-store.js       # Vector Store initialization script
├── src/
│   ├── solution1/                 # Solution 1: OpenAI implementation
│   │   ├── services/
│   │   │   ├── fileService.js      # Vector Store configuration service
│   │   │   ├── responseService.js  # Query response service
│   │   │   └── memoryService.js    # Memory management service
│   │   ├── routes/
│   │   │   └── api.js             # API routes
│   │   └── utils/
│   │       └── errorHandler.js    # Error handling
│   ├── shared/
│   │   ├── config/
│   │   │   └── constants.js       # Configuration constants
│   │   └── utils/
│   │       ├── logger.js          # Logging utility
│   │       └── validators.js      # Input validation
│   ├── public/                    # Frontend files
│   │   ├── index.html
│   │   ├── css/
│   │   │   └── custom.css
│   │   └── js/
│   │       └── app.js
│   └── assets/                    # Static assets
│       └── FK.pdf                 # Pre-loaded PDF document
├── server.js                      # Express server
├── package.json
├── .env                          # Environment variables (create this)
└── .env.example                  # Environment variables template
```

## 🔌 API Endpoints

### Get Configuration

```http
GET /api/solution1/config

Response:
{
  "success": true,
  "vectorStoreId": "vs_...",
  "vectorStoreInfo": {
    "id": "vs_...",
    "name": "FK",
    "file_counts": {
      "completed": 1,
      "in_progress": 0,
      "failed": 0
    },
    "created_at": 1234567890
  }
}
```

### Query

```http
POST /api/solution1/query
Content-Type: application/json

Body:
{
  "query": "Hur många dagar med föräldrapenning kan man få?",
  "threadId": "user-session-123"
}

Response:
{
  "success": true,
  "fileAnswer": "Du kan få föräldrapenning i upp till 480 dagar för ett barn...",
  "webAnswer": "According to the latest information...",
  "model": "gpt-4o-mini",
  "fileResponseId": "resp_...",
  "webResponseId": "resp_...",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 200,
    "total_tokens": 350,
    "estimated_cost": 0.000142
  },
  "timestamp": "2025-11-09T12:34:56.789Z"
}
```

### Get Conversation History

```http
GET /api/solution1/history/:threadId?limit=10

Response:
{
  "success": true,
  "threadId": "user-session-123",
  "summary": {
    "exists": true,
    "messageCount": 5,
    "totalUsage": {
      "total_tokens": 1750,
      "estimated_cost": 0.00071
    }
  },
  "history": [
    {
      "query": "Hur många dagar...",
      "fileAnswer": "...",
      "webAnswer": "...",
      "timestamp": "2025-11-09T12:34:56.789Z",
      "usage": { ... }
    }
  ]
}
```

### Clear Conversation History

```http
DELETE /api/solution1/history/:threadId

Response:
{
  "success": true,
  "message": "History cleared successfully"
}
```

### Get Vector Store Information

```http
GET /api/solution1/vector-store/:vectorStoreId

Response:
{
  "success": true,
  "id": "vs_...",
  "name": "FK",
  "file_counts": {
    "completed": 1
  },
  "created_at": 1234567890
}
```

### Get Statistics

```http
GET /api/solution1/statistics

Response:
{
  "success": true,
  "statistics": {
    "totalThreads": 5,
    "totalQueries": 25,
    "totalTokens": 8750,
    "estimatedTotalCost": 0.00357
  }
}
```

## 💰 Cost Information

Using **gpt-4o-mini** model (OpenAI's cheapest option):

- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens

Example costs:

- A typical query (150 input + 200 output tokens) ≈ $0.00014
- 100 queries ≈ $0.014
- 1,000 queries ≈ $0.14

**One-time costs:**

- Initial Vector Store creation and file upload: ~$0.001-0.01 (depending on PDF size)

## 🧪 Testing

### Manual Test Checklist

- [ ] **Vector Store Initialization**

  - [ ] Successfully run `npm run init:vectorstore`
  - [ ] Vector Store ID is generated
  - [ ] File is processed and marked as completed
  - [ ] VECTOR_STORE_ID can be added to `.env`

- [ ] **Configuration Loading**

  - [ ] Vector Store loads automatically on page load
  - [ ] Configuration endpoint returns correct information
  - [ ] Error shown if VECTOR_STORE_ID is not configured

- [ ] **File Search**

  - [ ] Correctly searches information in the pre-loaded PDF
  - [ ] Displays search results
  - [ ] Shows token usage statistics

- [ ] **Web Search**

  - [ ] Executes web search and returns results
  - [ ] Displays both file and web search results simultaneously
  - [ ] Results are relevant to the query

- [ ] **Conversation Memory**

  - [ ] Maintains conversation context
  - [ ] Displays conversation history
  - [ ] Clears conversation history when requested
  - [ ] Thread IDs are properly managed

- [ ] **Error Handling**
  - [ ] Handles API errors gracefully
  - [ ] Handles missing VECTOR_STORE_ID error
  - [ ] Displays user-friendly error messages
  - [ ] Shows appropriate error for rate limits

## ⚠️ Important Notes

1. **API Key Security**:

   - Never commit `.env` file to Git
   - Don't expose API keys in frontend code
   - Use environment variables for sensitive information
   - `.env` is already in `.gitignore`

2. **Cost Control**:

   - Regularly check OpenAI usage
   - Set API usage limits in OpenAI dashboard
   - Consider implementing query rate limiting
   - Monitor token usage statistics

3. **Vector Store Management**:

   - Vector Store is persistent - no need to recreate it
   - Only run `init:vectorstore` once or when updating the PDF
   - VECTOR_STORE_ID remains valid until explicitly deleted
   - Old Vector Stores should be deleted to avoid unnecessary charges

4. **Web Search**:

   - Uses OpenAI's built-in `web_search_preview` tool
   - No additional API keys required
   - May have slightly higher token costs than file search only

5. **PDF Updates**:
   - To update the PDF document, run `npm run init:vectorstore` again
   - Update the VECTOR_STORE_ID in `.env` with the new ID
   - Consider deleting the old Vector Store via OpenAI dashboard

## 🔧 Troubleshooting

### Server Won't Start

```
Error: OPENAI_API_KEY environment variable is missing
```

**Solution**: Ensure `.env` file exists and contains a valid OPENAI_API_KEY

### Vector Store Not Configured

```
Error: VECTOR_STORE_ID not configured in environment variables
```

**Solution**:

1. Run `npm run init:vectorstore`
2. Copy the generated VECTOR_STORE_ID
3. Add it to your `.env` file
4. Restart the server

### Initialization Failed

```
Error: File processing timeout
```

**Solution**:

- Check your internet connection
- Ensure the PDF file exists at `src/assets/FK.pdf`
- Verify your OpenAI API key is valid
- Check OpenAI API quota

### Query Failed

```
Error: Rate limit exceeded
```

**Solution**:

- Wait a few minutes before retrying
- Check OpenAI API limits in your dashboard
- Consider upgrading your API plan

### Configuration Load Failed

```
Error: Failed to get config
```

**Solution**:

- Verify VECTOR_STORE_ID is correctly set in `.env`
- Check that the Vector Store still exists in OpenAI
- Restart the server after updating `.env`

## 📚 Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **AI Service**: OpenAI Responses API, gpt-4o-mini
- **Tools**:
  - OpenAI file_search (Vector Store)
  - OpenAI web_search_preview
- **Environment**: dotenv
- **Vector Storage**: OpenAI Vector Store (persistent)

## 🚧 Future Improvements

- [ ] Implement Solution 2: Langchain Agent (using free Google Gemini)
- [ ] Add user authentication
- [ ] Implement Supabase vector storage option
- [ ] Support for multiple PDF documents
- [ ] Implement query rate limiting
- [ ] Add unit tests and integration tests
- [ ] Add multi-language support (Swedish/English)
- [ ] Deploy to production (Vercel/Netlify/Railway)
- [ ] Add PDF update UI for admins
- [ ] Implement vector store cleanup utility

## 📋 Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot reload
- `npm run init:vectorstore` - Initialize and upload PDF to Vector Store
- `npm test` - Run tests (not yet implemented)

## 📝 License

ISC

## 👤 Author

JL - Kurs 3 - 2025/11

---

## 🔄 Migration from Upload-based System

If you're migrating from the previous version where users uploaded PDFs:

1. Run `npm run init:vectorstore` to create the Vector Store
2. Add VECTOR_STORE_ID to your `.env` file
3. Restart the server
4. The PDF is now pre-loaded and ready for queries

**Benefits of the new system:**

- ✅ Faster user experience (no upload wait time)
- ✅ Reduced API costs (upload only once)
- ✅ Simpler user interface
- ✅ More reliable (no upload failures)
- ✅ Persistent storage

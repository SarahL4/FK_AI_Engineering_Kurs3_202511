# Försäkringskassan AI Assistant

An intelligent Q&A system that helps answer questions about Swedish parental benefits and children's allowances. The system uses AI to search both uploaded documents and the web to provide accurate answers.

## 🎯 Two Solutions Available

This project offers **two different implementations** to choose from:

### Quick Comparison

| Feature                 | Solution 1 (OpenAI)    | Solution 2 (Supabase)     |
| ----------------------- | ---------------------- | ------------------------- |
| **Setup Difficulty**    | ⭐ Easy (5 min)        | ⭐⭐ Moderate (15 min)    |
| **Storage**             | OpenAI Cloud           | Your Supabase Database    |
| **AI Model**            | GPT-4o-mini            | GPT-4o-mini or free mode  |
| **Cost (1000 queries)** | ~$0.14                 | ~$0.10 (or less) or free  |
| **Free Tier**           | ❌ No                  | ✅ Yes (Supabase)         |
| **Data Control**        | OpenAI manages         | You control               |
| **Web Search**          | ✅ Built-in            | ⚠️ Not yet implemented    |
| **Best For**            | Beginners, quick start | Cost savings, scalability |

### Which Should You Choose?

**Choose Solution 1 (OpenAI) if:**

- ✅ You're new to coding and want the easiest setup
- ✅ You want everything in one place (OpenAI handles all)
- ✅ You need web search functionality
- ✅ Setup time matters more than cost (~5 minutes)
- ✅ You don't want to manage a database

**Choose Solution 2 (Supabase) if:**

- ✅ You want to minimize costs (Supabase free tier!)
- ✅ You want control over where your data is stored
- ✅ You're comfortable with a bit more setup (~15 minutes)
- ✅ You plan to scale or add features later
- ✅ You want to learn modern tech (Langchain, vector databases)

---

## 🚀 Quick Start - Solution 1 (OpenAI)

**New to coding?** Start with Solution 1 - it's easier!

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/)
2. **Get OpenAI API Key**: Sign up at [platform.openai.com](https://platform.openai.com/)
3. **Setup Project**:
   ```bash
   npm install
   ```
4. **Create `.env` file** and add your API key
5. **Upload PDF**:
   ```bash
   npm run init:vectorstore
   ```
6. **Copy the `VECTOR_STORE_ID`** to your `.env` file
7. **Start app**:
   ```bash
   npm run dev
   ```
8. **Open browser**: Go to `http://localhost:3000`

## 🚀 Quick Start - Solution 2 (Supabase)

**Want lower costs and open source?** Choose Solution 2!

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/)
2. **Create Supabase Account**: Sign up at [supabase.com](https://supabase.com) (Free!)
3. **Get API Keys**:
   - OpenAI API Key from [platform.openai.com](https://platform.openai.com/)
   - Supabase URL and API Key from your project settings
4. **Setup Project**:
   ```bash
   npm install
   ```
5. **Create `.env` file** with Supabase credentials
6. **Setup Database**: Run the SQL script in Supabase dashboard
7. **Upload PDF**:
   ```bash
   npm run init:supabase
   ```
8. **Start app**:
   ```bash
   npm run dev:solution2
   ```
9. **Open browser**: Go to `http://localhost:3000`

📖 **Need more details?** Keep reading below!

## ✨ Features

- 📄 **Document Search**: Searches through pre-uploaded PDF documents instantly
- 🌐 **Web Search**: Gets real-time information from the internet
- 💬 **Smart Conversations**: Remembers previous questions for better context
- 💰 **Cost Efficient**: Uses OpenAI's most affordable model (gpt-4o-mini)
- 📊 **Usage Tracking**: Shows how much each query costs
- 🎨 **Modern Interface**: Clean and responsive design

## 📋 Prerequisites

### For Both Solutions

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)
  - You'll need to add payment method to your OpenAI account
  - Free trial credits may be available for new users
- **Basic Command Line Knowledge** - Ability to run commands in terminal/command prompt
- **Text Editor** - Any code editor (VS Code, Notepad++, etc.)

### Additional for Solution 2 (Supabase)

- **Supabase Account** - [Sign up free here](https://supabase.com)
  - Free tier includes 500MB database + 2GB file storage
  - No credit card required for free tier

---

## 🚀 Detailed Setup Guide - Solution 1 (OpenAI)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Configuration File

Create a new file named `.env` in the project root folder:

**On Windows:**

```bash
copy .env.example .env
```

**On Mac/Linux:**

```bash
cp .env.example .env
```

**Or manually create `.env` file with this content:**

```env
# Your OpenAI API Key (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxxx

# Vector Store ID (Will be generated in Step 3)
VECTOR_STORE_ID=

# Optional Settings (Can leave as default)
PORT=3000
NODE_ENV=development
OPENAI_MODEL=gpt-4o-mini
```

⚠️ **Important**: Replace `sk-proj-xxxx` with your actual OpenAI API key!

### 3. Upload PDF to OpenAI (One-time Setup)

This step uploads your PDF document to OpenAI's cloud storage:

```bash
npm run init:vectorstore
```

**What happens:**

1. The system uploads `src/assets/FK.pdf` to OpenAI
2. Creates a storage space (Vector Store) for the document
3. Processes the document for AI search
4. Generates a unique ID

**After running the command:**

1. Look for a line that says: `Vector Store ID: vs_xxxxxxxxxxxxx`
2. Copy this ID
3. Open your `.env` file
4. Paste the ID after `VECTOR_STORE_ID=`
5. Save the file

**Example:**

```env
VECTOR_STORE_ID=vs_abc123xyz456
```

💡 **Tip**: You only need to do this ONCE unless you want to update the PDF.

### 4. Start the Application

```bash
npm run dev
```

If everything is set up correctly, you should see:

```
Server running on http://localhost:3000
```

### 5. Open in Browser

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: **http://localhost:3000**
3. You should see the Försäkringskassan AI Assistant interface

🎉 **Congratulations! Your app is now running!**

---

## 🚀 Detailed Setup Guide - Solution 2 (Supabase)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. **Go to** [supabase.com](https://supabase.com) and sign up (it's free!)
2. **Click** "New Project"
3. **Fill in** project details:
   - Project name: `fk-assistant` (or any name you like)
   - Database password: Choose a strong password (save it!)
   - Region: Choose closest to you
4. **Wait** 1-2 minutes for project to be created

### 3. Setup Database Tables

1. **In your Supabase dashboard**, click "SQL Editor" from the left menu
2. **Click** "New Query"
3. **Copy and paste** the SQL code from `supabase/sql-setup.sql` file, or copy this code:

```sql
-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents (使用 embeddings 表名以匹配代码)
create table if not exists embeddings (
  id bigserial primary key,
  content text, -- corresponds to Document.pageContent
  metadata jsonb, -- corresponds to Document.metadata
  embedding vector(1536) -- 1536 works for OpenAI embeddings, change if needed
);

-- Create a function to search for documents (使用 match_embeddings 函数名以匹配代码)
create or replace function match_embeddings (
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  embedding jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    (embedding::text)::jsonb as embedding,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where metadata @> filter
  order by embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

4. **Click** "Run" button
5. **You should see**: "Success. No rows returned"

**What this script does:**

- Enables the `pgvector` extension for storing and searching vector embeddings
- Creates an `embeddings` table to store your PDF content chunks
- Creates a `match_embeddings` function for similarity search

### 4. Get Supabase Credentials

1. **Click** "Settings" (gear icon) in the left menu
2. **Click** "API" under Project Settings
3. **Copy** these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project API Key** (anon/public key)

### 5. Create Configuration File

Create a new file named `.env` in the project root folder with this content:

```env
# OpenAI API Key (for embeddings and AI responses)
OPENAI_API_KEY=sk-proj-xxxx

# Supabase Credentials
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_API_KEY=your_anon_key_here

# Optional Settings
PORT=3000
NODE_ENV=development
```

⚠️ **Important**: Replace all values with your actual credentials!

### 6. Upload PDF to Supabase

Run this command to process and upload the PDF:

```bash
npm run init:supabase
```

**What happens:**

1. Loads your PDF (`src/assets/FK.pdf`)
2. Splits it into smaller chunks (for better search)
3. Creates embeddings (vector representations) using OpenAI
4. Uploads everything to your Supabase database
5. Tests the search to make sure it works

**This will take 1-3 minutes** depending on PDF size.

**You should see:**

```
🚀 Initializing Supabase Vector Store
✅ Connected to Supabase
✅ PDF loaded: X pages
✅ Created X chunks
✅ Embeddings initialized
✅ Documents uploaded successfully!
🎉 Initialization completed successfully!
```

💡 **Tip**: You only need to do this ONCE unless you want to update the PDF.

### 7. Start the Application

```bash
npm run dev:solution2
```

If everything is set up correctly, you should see:

```
Server running on http://localhost:3000
Solution 2 (Supabase) is active
```

### 8. Open in Browser

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: **http://localhost:3000**
3. You should see the Försäkringskassan AI Assistant interface

🎉 **Congratulations! Solution 2 is now running!**

### 💰 Cost Comparison (Solution 2)

**Supabase costs:**

- Free tier: 500MB database, 2GB file storage, 2GB bandwidth
- For this app: **FREE** for typical use (< 1000 documents)

**OpenAI costs (only for embeddings):**

- One-time embedding cost: ~$0.002-0.01 (depending on PDF size)
- Per query: ~$0.0001-0.0003

**Total estimated cost:** < $0.10/month for personal use!

---

## 📖 How to Use

### Asking Questions

1. **Type your question** in the text box on the page
   - Example: "Hur många dagar med föräldrapenning kan man få?"
   - Example: "Om jag har två barn, hur mycket får barnbidrag?"
2. **Click "Submit Question and Search"**

3. **Wait a few seconds** - The AI will:

   - Search through the uploaded PDF document
   - Search the web for latest information
   - Combine both results to give you an answer

4. **View the results**:
   - Answer from the PDF document
   - Answer from web search
   - Cost information (how much the query cost)

### Additional Features

- **Conversation History**: Previous questions and answers are remembered
- **Clear History**: Click "Clear History" button to start fresh
- **Cost Tracking**: See real-time token usage and costs

### Example Questions

```
Hur många dagar med föräldrapenning kan man få?
Om jag har två barn, hur mycket får barnbidrag?
Vad är reglerna för föräldraledighet?
Kan man dela föräldrapenning mellan föräldrar?
```

## 🏗️ Project Structure

Understanding the main folders and files:

```
project-folder/
├── src/
│   ├── assets/
│   │   └── FK.pdf                 # 📄 Your PDF document
│   ├── public/
│   │   ├── index.html             # 🌐 Web interface
│   │   ├── css/                   # 🎨 Styles
│   │   └── js/                    # ⚙️ Frontend logic
│   └── solution1/
│       ├── services/              # 🔧 Backend logic
│       └── routes/                # 🛣️ API endpoints
├── scripts/
│   └── init-vector-store.js       # 📤 PDF upload script
├── server.js                      # 🖥️ Main server file
├── package.json                   # 📦 Dependencies list
├── .env                          # 🔐 Your configuration (create this!)
└── .env.example                  # 📋 Configuration template
```

**Key files you might need to modify:**

- `.env` - Your API keys and settings
- `src/assets/FK.pdf` - Replace with your own PDF
- `src/public/index.html` - Customize the web interface

## 💰 Cost Information

This app uses OpenAI's **gpt-4o-mini** - their most affordable AI model.

### Pricing (as of 2025)

- **Input**: $0.15 per million tokens (~750,000 words)
- **Output**: $0.60 per million tokens (~750,000 words)

### Real-world Costs

**Per Query:**

- Simple question: ~$0.0001 - $0.0003 (less than 1 cent!)
- Complex question: ~$0.0005 - $0.001

**Bulk Usage:**

- 100 questions: ~$0.01 - $0.05
- 1,000 questions: ~$0.10 - $0.50

**One-time Setup:**

- Uploading PDF: ~$0.001 - $0.01 (depending on PDF size)

💡 **Bottom line**: Very affordable for personal or educational use. Even heavy use typically costs less than $1/month.

⚠️ **Tip**: Set a usage limit in your OpenAI dashboard to avoid unexpected charges.

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

## ⚠️ Important Things to Know

### 🔐 Keep Your API Key Safe

- **Never share** your `.env` file or API key with anyone
- **Don't commit** `.env` to Git (it's already in `.gitignore`)
- **Regenerate your key** if you accidentally expose it

### 💰 Control Your Costs

- **Set spending limits** in OpenAI dashboard to prevent surprises
- **Monitor usage** at [platform.openai.com/usage](https://platform.openai.com/usage)
- The app shows estimated costs after each query
- Typical usage is very cheap (< $1/month for personal use)

### 📦 Document Storage

**Solution 1 (OpenAI Vector Store):**

- **Upload once**: Your PDF stays in OpenAI's storage - no need to re-upload
- **Persistent**: The `VECTOR_STORE_ID` works until you delete it
- **Update PDF**: Run `npm run init:vectorstore` again to upload a new version
- **Cleanup**: Delete old Vector Stores in OpenAI dashboard to avoid storage fees

**Solution 2 (Supabase):**

- **Upload once**: Embeddings are stored in your Supabase database
- **Free tier**: 500MB database storage (enough for many PDFs)
- **Update PDF**: Run `npm run init:supabase` again (will add new chunks)
- **Cleanup**: You can delete rows from the `embeddings` table in Supabase dashboard

### 🌐 Web Search Feature

- Works automatically - no extra setup needed
- Uses OpenAI's built-in web search
- Slightly more expensive than document-only search
- Provides up-to-date information from the internet

## ❓ Frequently Asked Questions (FAQ)

### Q: Which solution should I choose?

**A:**

- **Choose Solution 1 (OpenAI)** if you're a beginner or want the easiest setup. It takes ~5 minutes to set up.
- **Choose Solution 2 (Supabase)** if you want lower costs, more control over your data, or plan to scale. Setup takes ~15 minutes but saves money long-term.

### Q: Can I switch between solutions later?

**A:** Yes! Both solutions are independent. You can set up both and switch by using different start commands (`npm run dev` vs `npm run dev:solution2`).

### Q: What's the main difference between Solution 1 and 2?

**A:**

- **Solution 1**: Uses OpenAI's cloud storage (Vector Store). Everything happens in OpenAI's ecosystem. Easier but slightly more expensive.
- **Solution 2**: Uses your own Supabase database. You control the data. More setup but cheaper (Supabase has a free tier).

### Q: Do I need to know how to code?

**A:** Not really! Just follow the Quick Start Guide step by step. You only need to run a few commands in the terminal.

### Q: How much does each solution cost?

**A:**

- **Solution 1**: ~$0.14 per 1000 queries (OpenAI charges for storage + queries)
- **Solution 2**: ~$0.10 per 1000 queries or less (Supabase free tier + only OpenAI embeddings)

### Q: Where is my data stored?

**A:** Depends on which solution you use:

- **Solution 1**: PDF is stored in OpenAI's cloud (Vector Store)
- **Solution 2**: PDF embeddings are stored in your Supabase database (you control it!)

Both: Conversations are temporary and handled by the app.

### Q: Can I use my own PDF document?

**A:** Yes! Replace `src/assets/FK.pdf` with your PDF, then run:

- **Solution 1**: `npm run init:vectorstore`
- **Solution 2**: `npm run init:supabase`

### Q: Do I need to upload the PDF every time I start the app?

**A:** No! Upload once, and it stays in the cloud:

- **Solution 1**: Run `npm run init:vectorstore` once, then just `npm run dev`
- **Solution 2**: Run `npm run init:supabase` once, then just `npm run dev:solution2`

### Q: Can I use this without internet?

**A:** No, you need internet because it connects to OpenAI's servers for AI processing and web search.

### Q: Is this secure? Can others see my questions?

**A:** Your questions go to OpenAI's servers (just like ChatGPT). OpenAI doesn't use your data to train models if you're using the API. Don't share your API key with anyone.

### Q: What happens if I lose my VECTOR_STORE_ID?

**A:** Check your `.env` file first. If you lost it, you can find it in your OpenAI dashboard under "Storage" or run `npm run init:vectorstore` again to create a new one.

### Q: Can multiple people use this at the same time?

**A:** Yes, but they all use the same OpenAI API key, so costs will be shared on your account.

## 🔧 Common Problems & Solutions

### ❌ Problem: "Cannot find module" or "npm: command not found"

**Solution**: You need to install Node.js first

1. Go to [nodejs.org](https://nodejs.org/)
2. Download and install the LTS version
3. Restart your terminal/command prompt
4. Try again

### ❌ Problem: "OPENAI_API_KEY environment variable is missing"

**Solution**: Your `.env` file is missing or incorrect

1. Make sure you have a `.env` file in the project root folder
2. Open it and check that it has: `OPENAI_API_KEY=sk-proj-xxxxx`
3. Replace `sk-proj-xxxxx` with your actual API key
4. Save the file and restart the server

### ❌ Problem: "VECTOR_STORE_ID not configured" (Solution 1)

**Solution**: You need to upload the PDF first

1. Run: `npm run init:vectorstore`
2. Wait for it to finish (may take 30-60 seconds)
3. Copy the `vs_xxxxx` ID from the output
4. Open `.env` file
5. Add: `VECTOR_STORE_ID=vs_xxxxx` (your actual ID)
6. Save and restart: `npm run dev`

### ❌ Problem: "Missing SUPABASE_URL or SUPABASE_API_KEY" (Solution 2)

**Solution**: Your Supabase credentials are missing

1. Make sure you have a `.env` file in the project root
2. Add these lines:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_API_KEY=your_anon_key_here
   ```
3. Get your credentials from Supabase dashboard:
   - Go to Settings → API
   - Copy "Project URL" and "anon/public key"
4. Save and restart the server

### ❌ Problem: "relation 'embeddings' does not exist" (Solution 2)

**Solution**: You haven't run the SQL setup script

1. Go to your Supabase dashboard
2. Click "SQL Editor" from the left menu
3. Copy and paste the SQL script from the [Solution 2 Setup Guide](#3-setup-database-tables)
4. Click "Run"
5. Wait for "Success" message
6. Try running `npm run init:supabase` again

### ❌ Problem: "Port 3000 is already in use"

**Solution**: Another program is using port 3000

- **Option 1**: Stop the other program and try again
- **Option 2**: Use a different port:
  1. Open `.env` file
  2. Change `PORT=3000` to `PORT=3001` (or any other number)
  3. Save and restart
  4. Access at: `http://localhost:3001`

### ❌ Problem: "Rate limit exceeded" or "Quota exceeded"

**Solution**: You've hit OpenAI's usage limits

1. Wait 1-2 minutes and try again
2. Check your OpenAI account at [platform.openai.com](https://platform.openai.com/)
3. Verify you have:
   - A payment method added
   - Available credits or budget
4. You may need to add funds or upgrade your plan

### ❌ Problem: Server starts but page shows "Cannot connect"

**Solution**: Check your browser URL

1. Make sure you're going to: `http://localhost:3000` (not https)
2. Try refreshing the page (F5)
3. Try a different browser
4. Check if the server is really running (should say "Server running on...")

### ❌ Problem: PDF upload takes forever or times out

**Solution**: Network or file size issue

1. Check your internet connection
2. Make sure `src/assets/FK.pdf` exists and is not too large (< 50MB)
3. Try again - sometimes OpenAI servers are busy
4. Wait a few minutes between retries

### 💡 Still Having Problems?

1. **Check the terminal/console** for error messages
2. **Restart everything**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```
3. **Start fresh**:
   ```bash
   # Delete node_modules folder
   # Then reinstall
   npm install
   npm run dev
   ```

## 📚 Technologies Used

**For Beginners**: Here's what powers this application

### Solution 1 (OpenAI)

- **Node.js** - JavaScript runtime that runs the server
- **Express** - Web framework that handles requests
- **OpenAI API** - The AI brain that answers questions
  - Uses `gpt-4o-mini` model (affordable and fast)
  - `file_search` tool for searching PDFs
  - `web_search_preview` tool for internet searches
  - Vector Store for document storage
- **HTML/CSS/JavaScript** - Standard web technologies for the interface
- **Tailwind CSS** - Makes the UI look modern and responsive

**Storage:** Everything is stored in OpenAI's cloud (Vector Store)

### Solution 2 (Supabase)

- **Node.js** - JavaScript runtime that runs the server
- **Express** - Web framework that handles requests
- **Langchain** - Framework for building AI applications
- **Supabase** - Open-source database (PostgreSQL) with vector support
  - pgvector extension for similarity search
  - Free tier available!
- **OpenAI Embeddings** - Converts text to vectors for search
- **HTML/CSS/JavaScript** - Standard web technologies for the interface
- **Tailwind CSS** - Makes the UI look modern and responsive

**Storage:** PDF embeddings stored in your Supabase database (you control the data!)

## 🚧 Future Improvements

- [x] ✅ Implement Solution 2: Supabase vector storage with Langchain
- [ ] Add Google Gemini as alternative AI model
- [ ] Add user authentication
- [ ] Support for multiple PDF documents
- [ ] Implement query rate limiting
- [ ] Add unit tests and integration tests
- [ ] Add multi-language support (Swedish/English)
- [ ] Deploy to production (Vercel/Netlify/Railway)
- [ ] Add PDF update UI for admins
- [ ] Implement vector store cleanup utility
- [ ] Add comparison dashboard between Solution 1 and 2

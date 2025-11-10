# Försäkringskassan AI Assistant

An intelligent Q&A system that helps answer questions about Swedish parental benefits and children's allowances. The system uses AI to search both uploaded documents and the web to provide accurate answers.

## 🎯 Two Solutions Available

This project offers **two different implementations** to choose from:

| Feature                 | Solution 1 (OpenAI)    | Solution 2 (Supabase)     |
| ----------------------- | ---------------------- | ------------------------- |
| **Setup Difficulty**    | ⭐ Easy (5 min)        | ⭐⭐ Moderate (15 min)    |
| **Storage**             | OpenAI Cloud           | Your Supabase Database    |
| **AI Model**            | GPT-4o-mini            | GPT-4o-mini               |
| **Cost (1000 queries)** | ~$0.14                 | ~$0.10                    |
| **Free Tier**           | ❌ No                  | ✅ Yes (Supabase)         |
| **Data Control**        | OpenAI manages         | You control               |
| **Web Search**          | ✅ Built-in            | ✅ Tavily                 |
| **Best For**            | Beginners, quick start | Cost savings, scalability |

### Which Should You Choose?

**Choose Solution 1 (OpenAI) if:**

- ✅ You're new to coding and want the easiest setup
- ✅ You want everything in one place (OpenAI handles all)
- ✅ Setup time matters more than cost (~5 minutes)
- ✅ You don't want to manage a database

**Choose Solution 2 (Supabase) if:**

- ✅ You want to minimize costs (Supabase free tier!)
- ✅ You want control over where your data is stored
- ✅ You're comfortable with a bit more setup (~15 minutes)
- ✅ You plan to scale or add features later

---

## 🚀 Quick Start - Solution 1 (OpenAI)

**New to coding?** Start with Solution 1 - it's easier!

### Step 1: Install Node.js

Download and install from [nodejs.org](https://nodejs.org/)

### Step 2: Get OpenAI API Key

1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new API key
4. ⚠️ **Important**: Add a payment method to your OpenAI account

### Step 3: Setup Project

```bash
# Clone or download this project
cd https://github.com/SarahL4/FK_AI_Engineering_Kurs3_202511.git

# Install dependencies
npm install
```

### Step 4: Create Configuration File

Create a `.env` file in the project root:

**Windows:**

```bash
copy .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-proj-your-key-here
PORT=3000
NODE_ENV=development
```

### Step 5: Upload PDF

```bash
npm run init:vectorstore
```

**After running:**

1. Look for: `Vector Store ID: vs_xxxxxxxxxxxxx`
2. Copy this ID
3. Add to `.env`: `VECTOR_STORE_ID=vs_xxxxxxxxxxxxx`
4. Save the file

### Step 6: Start Application

```bash
npm run dev
```

### Step 7: Open Browser

Go to: **http://localhost:3000**

🎉 **Done!** You can now ask questions about the PDF document.

---

## 🚀 Quick Start - Solution 2 (Supabase)

**Want lower costs and more control?** Choose Solution 2!

### Step 1: Install Node.js

Download and install from [nodejs.org](https://nodejs.org/)

### Step 2: Create Supabase Account

1. Sign up at [supabase.com](https://supabase.com) (Free!)
2. Click "New Project"
3. Fill in project details:
   - Project name: `fk-assistant` (or any name)
   - Database password: Choose a strong password
   - Region: Choose closest to you
4. Wait 1-2 minutes for project creation

### Step 3: Setup Database

1. In Supabase dashboard, click **"SQL Editor"** from left menu
2. Click **"New Query"**
3. Copy and paste the SQL code from `supabase/sql-setup.sql`:

```sql
-- Enable the pgvector extension
create extension if not exists vector;

-- Create embeddings table
create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- Create search function
create or replace function match_embeddings (
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  embedding jsonb,
  similarity float
)
language plpgsql
as $$
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

4. Click **"Run"** button
5. You should see: "Success. No rows returned"

### Step 4: Get API Keys

**OpenAI API Key:**

1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Create a new API key

**Supabase Credentials:**

1. In Supabase dashboard, click **"Settings"** (gear icon)
2. Click **"API"** under Project Settings
3. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (under API Keys section)

### Step 5: Setup Project

```bash
# Install dependencies
npm install
```

### Step 6: Create Configuration File

Create `.env` file in project root:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-your-key-here

# Supabase Credentials
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_API_KEY=your_anon_key_here

# Optional
PORT=3000
NODE_ENV=development
```

### Step 7: Upload PDF

```bash
npm run init:supabase
```

This will take 1-3 minutes. You should see:

```
✅ Connected to Supabase
✅ PDF loaded: X pages
✅ Created X chunks
✅ Documents uploaded successfully!
```

### Step 8: Start Application

```bash
npm run dev
```

### Step 9: Open Browser

Go to: **http://localhost:3000**

🎉 **Done!** Solution 2 is now running!

---

## ✨ Features

- 📄 **Document Search**: Searches through pre-uploaded PDF documents
- 🌐 **Web Search**: Gets real-time information from the internet
- 💬 **Conversation History**: Remembers previous questions and answers
- 🔄 **History Switching**: Switch between Solution 1 and Solution 2 history
- 💰 **Cost Tracking**: Shows token usage and estimated costs
- ⏱️ **Performance Metrics**: Displays response time for each query
- 🎨 **Modern Interface**: Clean and responsive design

## 📖 How to Use

### Asking Questions

1. **Type your question** in the text box

   - Example: "Hur många dagar med föräldrapenning kan man få?"
   - Example: "Om jag har två barn, hur mycket får barnbidrag?"

2. **Choose a solution**:

   - Click **"Query Solution 1"** for OpenAI solution
   - Click **"Query Solution 2"** for Supabase solution
   - Click **"Query Both"** to compare results

3. **View results**:
   - Answer from the PDF document
   - Answer from web search
   - Token usage and cost information
   - Response time

### Conversation History

- **View History**: Click "📜 Show History" button
- **Switch Solutions**: Use "Solution 1" / "Solution 2" buttons in history panel
- **Clear History**: Click "🗑️ Clear History" to remove all history
- **Total Cost**: See cumulative cost at the top

### Example Questions

```
Hur många dagar med föräldrapenning kan man få?
Om jag har två barn, hur mycket får barnbidrag?
Vad är reglerna för föräldraledighet?
Kan man dela föräldrapenning mellan föräldrar?
```

---

## 💰 Cost Information

### Pricing (OpenAI gpt-4o-mini)

- **Input**: $0.15 per million tokens
- **Output**: $0.60 per million tokens

### Real-world Costs

**Per Query:**

- Simple question: ~$0.0001 - $0.0003
- Complex question: ~$0.0005 - $0.001

**Monthly Usage:**

- 100 questions: ~$0.01 - $0.05
- 1,000 questions: ~$0.10 - $0.50

**One-time Setup:**

- PDF upload: ~$0.001 - $0.01

💡 **Bottom line**: Very affordable for personal or educational use. Typically costs less than $1/month.

⚠️ **Tip**: Set a usage limit in your OpenAI dashboard to avoid unexpected charges.

---

## 🏗️ Project Structure

```
project-folder/
├── src/
│   ├── assets/
│   │   └── FK.pdf                 # Your PDF document
│   ├── public/
│   │   ├── index.html             # Web interface
│   │   ├── css/                   # Styles
│   │   └── js/                    # Frontend logic
│   ├── solution1/                 # OpenAI solution
│   │   ├── services/              # Backend logic
│   │   └── routes/                # API endpoints
│   └── solution2/                 # Supabase solution
│       ├── services/              # Backend logic
│       └── routes/                # API endpoints
├── supabase/
│   └── sql-setup.sql              # Database setup script
├── scripts/
│   └── init-vector-store.js       # PDF upload script (Solution 1)
├── server.js                      # Main server file
├── package.json                   # Dependencies
├── .env                          # Configuration (create this!)
└── .env.example                  # Configuration template
```

---

## ⚠️ Important Notes

### 🔐 Keep Your API Key Safe

- **Never share** your `.env` file or API key
- **Don't commit** `.env` to Git (already in `.gitignore`)
- **Regenerate** your key if accidentally exposed

### 💰 Control Your Costs

- **Set spending limits** in OpenAI dashboard
- **Monitor usage** at [platform.openai.com/usage](https://platform.openai.com/usage)
- The app shows estimated costs after each query

### 📦 Document Storage

**Solution 1 (OpenAI):**

- PDF stays in OpenAI's storage (no re-upload needed)
- Update: Run `npm run init:vectorstore` again
- Cleanup: Delete old Vector Stores in OpenAI dashboard

**Solution 2 (Supabase):**

- Embeddings stored in your Supabase database
- Free tier: 500MB (enough for many PDFs)
- Update: Run `npm run init:supabase` again
- Cleanup: Delete rows from `embeddings` table in Supabase

---

## 📚 Technologies Used

### Solution 1 (OpenAI)

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **OpenAI API** - AI processing (gpt-4o-mini)
- **Tailwind CSS** - Modern UI styling

### Solution 2 (Supabase)

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Langchain** - AI application framework
- **Supabase** - PostgreSQL database with vector support
- **OpenAI Embeddings** - Text to vector conversion
- **Tailwind CSS** - Modern UI styling

---

## 🧪 Testing

For comprehensive testing instructions, see [TESTING.md](TESTING.md)

---

## 🚧 Future Improvements

- [x] ✅ Implement Solution 2: Supabase vector storage
- [x] ✅ Add conversation history for both solutions
- [x] ✅ Add cost tracking and performance metrics
- [ ] Add user authentication
- [ ] Support for multiple PDF documents
- [ ] Add unit tests and integration tests
- [x] Deploy to production (Vercel/Netlify/Railway)

---

## 📄 License

This project is for educational purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

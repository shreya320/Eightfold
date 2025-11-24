# Interview Practice Partner

**Interview Practice Partner** is an AI-powered agent designed to help users prepare for job interviews. Its primary motivation is to serve individuals like the developer, who understand the challenges of interview preparation firsthand. This tool enables users to practice mock interviews, receive role-specific questions, and get guided feedback for improvement.


## Target Users

- Job seekers preparing for interviews
- Students or professionals looking to practice mock interviews
- Anyone who wants structured, role-specific interview practice


## Architecture

### Backend

- **Framework:** FastAPI
- **API:** Google Gemini API (Generative AI)
- **Files:**
  - `app.py` – Main FastAPI backend with endpoints `/start` and `/next` and `/feedback`
  - `.env` – Stores API keys
  - `config.py` – Configuration file for constants and settings
  - `requirements.txt` – Python dependencies
- **Logic:**  
  1. `/start` endpoint provides the first question based on the selected role.  
  2. `/next` endpoint provides user answers using Gemini API and generates the next relevant question.
  3. `/feedback` endpoint evaluates user answers and provides feedback.
- **No database** – Conversation history is maintained client-side and sent with each request.

### Frontend

- **Files:**
  - `index.html` – Main interface
  - `style.css` – Styling for a clean and responsive UI
  - `app.js` – Handles user interactions, API calls, and displays questions/answers
- **Interaction:** Frontend communicates with the FastAPI backend via POST requests.

### Directory Structure
Eightfold/
├─ backend/
│ ├─ app.py
│ ├─ config.py
│ ├─ .env
│ └─ requirements.txt
├─ frontend/
│ ├─ index.html
│ ├─ style.css
│ └─ app.js
├─ README.md
└─ .gitignore


## Design Decisions

- **FastAPI:** Chosen for its simplicity, speed, and easy integration with frontend JavaScript. Supports async processing and easy testing.
- **Gemini API:** Free, accessible, and provides accurate, context-aware responses for role-specific interview guidance.
- **No database:** Keeps the project lightweight; conversation history is handled on the frontend and passed to backend as needed.
- **Role-based questions:** Ensures mock interviews are realistic and tailored to the user's field.


## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd Eightfold
```

2. **Set up backend**

```
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

3. ** Configure environmnent**

Create a .env file in backend/:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

4. **Run the backend**
```
uvicorn app:app --reload
```

Backend will be available at http://127.0.0.1:8000

5. **Open the frontend**

Open frontend/index.html in a browser. Ensure the frontend sends requests to the correct backend URL.


## Usage

- Select a role and click Start Interview → /start returns the first question.
- Submit your answer → /next evaluates it and returns the next question.
- Keep answering questions to simulate a full mock interview.

## Future Improvements

- Add user authentication and persistent history storage.
- Improve frontend UI for better UX.
- Give options for preparing for specific companies.
- Deploy on a web server for online accessibility.
- Provide sample answers for questions that users are unsure of.
- Give options for various rounds (e.g technical, behavioural, managerial etc) 




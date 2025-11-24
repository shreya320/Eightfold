from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterviewRequest(BaseModel):
    role: str

class ResponseRequest(BaseModel):
    role: str
    user_answer: str
    history: list[str]

class FeedbackRequest(BaseModel):
    role: str
    history: list[str]


gemini_model = genai.GenerativeModel("gemini-2.5-flash")

@app.post("/start")
def start_interview(req: InterviewRequest):
    """Starts the interview and returns the first question."""
    role = req.role
    initial_prompt = f"You are a professional interviewer for a {role} role. Start the interview with a welcoming, standard first question. Return ONLY the question."

    try:
        response = gemini_model.generate_content(initial_prompt)
        question = response.text.strip()
    except Exception as e:
        print(f"Error starting interview: {e}")
        question = "Hello! Please tell me a little bit about yourself."

    return {"question": question}


@app.post("/next")
def process_answer(req: ResponseRequest):
    """Processes the user's answer and generates the next question or ends the interview."""
    MAX_TURNS = 2
    
    if len(req.history) >= MAX_TURNS * 2:
        return {"question": "Thank you for your time. I will now compile your feedback.", "status": "COMPLETED"}

    role = req.role
    user_answer = req.user_answer
    history_string = "\n".join(req.history)

    prompt = f"""
    You are interviewing for: {role}.
    The candidate just gave this answer: "{user_answer}"

    Full conversation history (use this for context):
    {history_string}

    Ask a helpful follow-up OR the next question.
    Keep the interview moving. Return ONLY the question.
    """

    try:
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
    except Exception as e:
        print(f"Error getting next question: {e}")
        return {"question": "I apologize, there was a brief technical error. Can you please rephrase your last answer?", "status": "QNA"}

    return {"question": response_text, "status": "QNA"}


@app.post("/feedback")
async def get_feedback(req: FeedbackRequest):
    """Generates a detailed feedback report."""
    role = req.role
    history_string = "\n".join(req.history)

    feedback_prompt = f"""
    Evaluate the interview performance for the candidate applying for the role: {role}.

    Conversation:
    {history_string}

    Provide:
    1. A short summary paragraph (3-4 sentences).
    2. A markdown table for key metrics:
        | Metric | Rating | Notes |
        |---|---|---|
        | Communication | [Score 1-10] | [Brief comment on clarity/articulation] |
        | Content Depth | [Score 1-10] | [Brief comment on domain knowledge] |
        | Confidence | [Low/Medium/High] | [Assessment of self-assurance] |
        | Recommendation | [Hire/Maybe/No-Hire] | [Final hiring decision] |

    Ensure the output is ONLY the summary and the markdown table.
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = await model.generate_content_async(feedback_prompt)
        feedback = response.text.strip()
        return {"feedback_report": feedback}

    except Exception as e:
        print(f"Error generating feedback: {e}")
        return {"feedback_report": f"Error generating report: {e}"}
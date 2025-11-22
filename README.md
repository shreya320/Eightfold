2. Interview Practice Partner
Build an agent that helps users prepare for job interviews. Your Al agent should:
. Conduct mock interviews for specific roles (e.g. sales, engineer, retail associate)
. Ask follow-up questions like a real interviewer would
. Provide post-interview feedback on responses and identify areas for improvement
(communication, technical knowledge, etc.)
. Interaction Mode: Voice preferred, chat acceptable


EVALUATION CRITERIA
You shall be evaluated on Conversational Quality, Agentic Behaviour, Technical Implementation,
Intelligence & Adaptability. To build a strong submission, we encourage you to:
· Prioritize conversation quality over just functionality
. Document the reasoning behind your design decisions and include it in your README file
. Test with multiple people and present demo scenarios such as:
o The Confused User (unsure what they want)
The Efficient User (wants quick results)
The Chatty User (frequently goes off topic)
The Edge Case Users (goes off topic/provides invalid inputs/submits requests beyond
bot's capabilities)

Motivation:
since i have given a lot of interviews, i connect a lot with target audience, i would want to make something i want to use myself, tking a lot of feedback from my friends in similar situations, would help me connect and make somethign thst can truly create a positive impact on the audience using it. 

major concentration areas:

specific role/job 
follow up
feedback areas

extra stuff if time: 
company specific
resume specific
behavioral questions
sample answers


| Component                               | Choice                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| Backend                                 | **FastAPI** (better for async + streaming + clean structure)                     |
| Frontend                                | **HTML + Tailwind + Vanilla JS** (fastest + voice support)                       |
| Voice Input                             | **Web Speech API** in browser                                                    |
| Voice Output (optional but recommended) | **SpeechSynthesis API**                                                          |
| AI Model                                | Gemini API (because you already use it)                                          |
| Deployment                              | Backend: **Render / HuggingFace Spaces**<br>Frontend: **Netlify / GitHub Pages** |



**sample evaluation metrics

| Category       | Score Type          |
| -------------- | ------------------- |
| Communication  | 1–10                |
| Content depth  | 1–10                |
| Clarity        | 1–10                |
| Examples       | yes/no              |
| Confidence     | low / medium / high |
| Recommendation | final verdict       |





to do:
frontend
backend
voice frontend
AI behavioural rules 
deployement


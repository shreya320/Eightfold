const startBtn = document.getElementById("startBtn");
const chatBox = document.getElementById("chatBox");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const answerInput = document.getElementById("answerInput");
const roleSelect = document.getElementById("roleSelect");

// --- Configuration and State ---
const BACKEND_URL = 'http://127.0.0.1:8000'; // **CRITICAL: Change this if your FastAPI server is on a different port**
let recognition;
let listening = false;
let conversationHistory = []; // Stores the full Q&A for context
let currentRole = "";
// -------------------------------


function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(speech);
}

function addMessage(text, sender) {
    const div = document.createElement("div");
    div.classList.add("message", sender);
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- API Helper Function ---
async function apiCall(endpoint, data) {
    try {
        const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error communicating with the backend:", error);
        addMessage("Connection error: Could not reach the interview bot.", "system");
        return null;
    }
}
// --------------------------


// 1. START INTERVIEW BUTTON
startBtn.onclick = async () => {
    currentRole = roleSelect.value;
    
    // Reset state
    conversationHistory = [];
    chatBox.innerHTML = "";
    
    document.getElementById("chatBox").classList.remove("hidden");
    document.querySelector(".input-area").classList.remove("hidden");
    
    addMessage(`Starting interview for: ${currentRole.replace(/_/g, ' ').toUpperCase()}`, "system");

    // Call /start endpoint
    const result = await apiCall("start", { role: currentRole });
    
    if (result && result.question) {
        const question = result.question;
        conversationHistory.push(`Interviewer: ${question}`);
        addMessage(question, "system");
        speak(question);
    }
};


// 2. MIC BUTTON LOGIC (Remains mostly the same, but sends answer on end)
micBtn.onclick = () => {
    if (!("webkitSpeechRecognition" in window)) {
        alert("Voice recognition not supported in this browser.");
        return;
    }

    if (!recognition) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
    }

    if (!listening) {
        listening = true;
        micBtn.style.background = "green";
        recognition.start();

        recognition.onresult = (event) => {
            answerInput.value = event.results[0][0].transcript;
        };

        recognition.onend = () => {
            listening = false;
            micBtn.style.background = "#4b6cff";
            // AUTOMATICALLY SEND the transcribed answer
            if (answerInput.value.trim().length > 0) {
                sendUserAnswer(answerInput.value.trim());
            }
        };
        
        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            listening = false;
            micBtn.style.background = "#4b6cff";
        };
    }
};


// 3. SEND BUTTON LOGIC
sendBtn.onclick = () => {
    const text = answerInput.value.trim();
    if (!text) return;
    
    sendUserAnswer(text);
};


// 4. CORE FUNCTION TO SEND ANSWER AND GET NEXT QUESTION
async function sendUserAnswer(text) {
    addMessage(text, "user");
    answerInput.value = "";
    
    // Add user's answer to history before sending
    conversationHistory.push(`Candidate: ${text}`);

    const dataToSend = {
        role: currentRole,
        user_answer: text,
        history: conversationHistory 
    };
    
    // Call /next endpoint
    const result = await apiCall("next", dataToSend);
    
    if (result && result.question) {
        const nextQuestion = result.question;
        
        addMessage(nextQuestion, "system");
        speak(nextQuestion);
        
        // Add the new question to history for the next turn
        if (!nextQuestion.includes("feedback")) { // Avoid adding the final feedback command as a Q
             conversationHistory.push(`Interviewer: ${nextQuestion}`);
        }
        
        // FUTURE LOGIC: Check if the question includes "feedback" to switch to the Feedback Phase
        if (nextQuestion.toLowerCase().includes("feedback")) {
            console.log("Interview ended, compiling feedback...");
            // You would call a separate /feedback endpoint here 
            // to get the final evaluation report.
        }
    }
}
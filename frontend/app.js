// --- GLOBAL ELEMENT DECLARATIONS ---
const startBtn = document.getElementById("startBtn");
const chatBox = document.getElementById("chatBox");
const micBtn = document.getElementById("micBtn");
const sendBtn = document.getElementById("sendBtn");
const answerInput = document.getElementById("answerInput");
const roleSelect = document.getElementById("roleSelect");
const statusMessage = document.getElementById("statusMessage");
const micStatus = document.getElementById("micStatus");
const feedbackContainer = document.getElementById("feedbackContainer");
const feedbackContent = document.getElementById("feedbackContent");
const setupArea = document.getElementById("setupArea");
const restartBtn = document.getElementById("restartBtn");

// --- STATE AND CONFIGURATION ---
const BACKEND_URL = 'http://127.0.0.1:8000';
let recognition;
let listening = false;
let conversationHistory = [];
let currentRole = "";
let interviewCompleted = false;

let finalTranscript = '';
let silenceTimer = null;
const SILENCE_THRESHOLD = 4000;

// --- CORE HELPER FUNCTIONS ---
function speak(text) {
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = "en-US";
        speech.rate = 1;
        speechSynthesis.speak(speech);
    } else {
        console.warn("Speech synthesis not supported.");
    }
}

function addMessage(text, sender) {
    const div = document.createElement("div");
    div.classList.add("message", sender);
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiCall(endpoint, data) {
    try {
        const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`, await response.text());
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error communicating with the backend:", error);
        addMessage("Connection error: Could not reach the interview bot.", "system");
        return null;
    }
}

// --- MIC CONTROL HELPERS ---
function stopListening() {
    if (listening && recognition) {
        recognition.stop();
        listening = false;
    }
    micBtn.style.background = "#90d4ff";
    micStatus.classList.remove("listening");
    clearTimeout(silenceTimer);
    silenceTimer = null;
}

function startListening() {
    if (interviewCompleted) return;
    if (recognition && !listening) {
        finalTranscript = '';
        answerInput.value = '';
        listening = true;
        micBtn.style.background = "#ff5e5e";
        micStatus.classList.add("listening");
        statusMessage.innerText = "Listening...";
        setTimeout(() => { recognition.start(); }, 500);
    }
}

// --- AUTO-SUBMIT LOGIC ---
function submitAnswer() {
    if (answerInput.disabled) { stopListening(); return; }
    stopListening();
    if (finalTranscript.trim().length > 0) sendUserAnswer(finalTranscript.trim());
    else startListening();
}

// --- 1. START INTERVIEW BUTTON ---
startBtn.onclick = async () => {
    currentRole = roleSelect.value;
    conversationHistory = [];
    chatBox.innerHTML = "";
    interviewCompleted = false;

    setupArea.classList.add("hidden");
    chatBox.classList.remove("hidden");
    document.querySelector(".input-area").classList.remove("hidden");
    sendBtn.disabled = true;
    answerInput.disabled = true;

    addMessage(`Starting interview for: ${currentRole.replace(/_/g, ' ').toUpperCase()}`, "system");
    statusMessage.innerText = `Preparing interview for ${currentRole.replace(/_/g, ' ')}...`;

    const result = await apiCall("start", { role: currentRole });
    if (result && result.question) {
        const question = result.question;
        addMessage(question, "system");

        await new Promise(resolve => {
            const utterance = new SpeechSynthesisUtterance(question);
            utterance.onend = resolve;
            speak(question);
        });

        conversationHistory.push(`Interviewer: ${question}`);
        answerInput.disabled = false;
        sendBtn.disabled = false;
        startListening();
    } else {
        statusMessage.innerText = "Error starting interview. Please check the backend.";
    }
};

// --- 2. MIC BUTTON LOGIC ---
micBtn.onclick = () => {
    if (interviewCompleted) return;
    if (!("webkitSpeechRecognition" in window)) { alert("Voice recognition not supported."); return; }

    if (!recognition) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let currentInterim = '';
            let currentFinal = finalTranscript;
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) currentFinal += event.results[i][0].transcript + ' ';
                else currentInterim += event.results[i][0].transcript;
            }
            finalTranscript = currentFinal.trim();
            answerInput.value = finalTranscript + (currentInterim ? ' ' + currentInterim : '');
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(submitAnswer, SILENCE_THRESHOLD);
        };

        recognition.onend = () => { if (listening && !interviewCompleted) recognition.start(); };
        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            clearTimeout(silenceTimer);
            if (listening && !interviewCompleted) setTimeout(recognition.start, 1000);
            else stopListening();
        };
    }

    if (!listening) { startListening(); sendBtn.disabled = false; answerInput.disabled = false; }
    else stopListening();
};

// --- 3. SEND BUTTON LOGIC ---
sendBtn.onclick = () => {
    if (answerInput.disabled) return;
    const text = answerInput.value.trim();
    if (!text) return;
    sendBtn.disabled = true;
    sendUserAnswer(text);
};

// --- 4. SEND ANSWER + LIVE FEEDBACK ---
async function sendUserAnswer(text) {
    if (interviewCompleted) return;

    addMessage(text, "user");
    answerInput.value = "";
    conversationHistory.push(`Candidate: ${text}`);

    stopListening();
    sendBtn.disabled = true;
    answerInput.disabled = true;
    statusMessage.innerText = "Processing your response...";

    await wait(1500);

    const dataToSend = { role: currentRole, user_answer: text, history: conversationHistory };

    const [result, feedbackResponse] = await Promise.all([
        apiCall("next", dataToSend),
        apiCall("feedback", { role: currentRole, history: conversationHistory })
    ]);

    if (!result) {
        statusMessage.innerText = "Connection error. Try again.";
        sendBtn.disabled = false;
        answerInput.disabled = false;
        startListening();
        return;
    }

    const nextQuestion = result.question || "Interview complete.";
    const status = result.status || "QNA";
    const liveFeedback = feedbackResponse?.feedback_report || "⚠️ No feedback received.";

    // Update chat & live feedback
    addMessage(nextQuestion, "system");
    conversationHistory.push(`Interviewer: ${nextQuestion}`);
    feedbackContent.innerHTML = `<h3>📌 Live Feedback</h3><pre>${liveFeedback}</pre>`;

    await new Promise(resolve => {
        const utterance = new SpeechSynthesisUtterance(nextQuestion);
        utterance.onend = resolve;
        speak(nextQuestion);
    });

    if (status === "QNA") {
        statusMessage.innerText = "Your turn. Answer when ready.";
        answerInput.disabled = false;
        sendBtn.disabled = false;
        startListening();
        return;
    }

    // If interview completed
    interviewCompleted = true;
    stopListening();
    sendBtn.disabled = true;
    answerInput.disabled = true;
    statusMessage.innerText = "Interview complete. Final feedback below.";
    feedbackContent.innerHTML = `<h3>📑 Full Interview Review</h3><pre>${liveFeedback}</pre>`;
    speak("Your final interview feedback report is ready.");
}

// --- 5. RESTART BUTTON LOGIC ---
restartBtn.onclick = () => {
    interviewCompleted = false;
    if (listening) stopListening();
    if (speechSynthesis.speaking) speechSynthesis.cancel();

    chatBox.classList.add("hidden");
    document.querySelector(".input-area").classList.add("hidden");
    setupArea.classList.remove("hidden");
    statusMessage.innerText = "Choose a role and click 'Start' to begin.";
};

let currentImageBase64 = null;
let currentImageMimeType = null;
let currentUtterance = null; // Dùng cho SpeechSynthesis

document.addEventListener('DOMContentLoaded', () => {
    const solveBtn = document.getElementById('solveBtn');
    solveBtn.addEventListener('click', handleSolveMath);

    // Xử lý upload ảnh
    const imageUpload = document.getElementById('imageUpload');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');

    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreviewContainer.classList.remove('hidden');
            
            const dataUrl = event.target.result;
            currentImageMimeType = dataUrl.split(';')[0].split(':')[1];
            currentImageBase64 = dataUrl.split(',')[1];
        };
        reader.readAsDataURL(file);
    });

    removeImageBtn.addEventListener('click', () => {
        imageUpload.value = '';
        currentImageBase64 = null;
        currentImageMimeType = null;
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
    });

    // Xử lý dán (Paste / Ctrl+V) ảnh từ clipboard
    document.addEventListener('paste', function(e) {
        if (!document.getElementById('userView').classList.contains('active')) return;

        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreview.src = event.target.result;
                    imagePreviewContainer.classList.remove('hidden');
                    
                    const dataUrl = event.target.result;
                    currentImageMimeType = dataUrl.split(';')[0].split(':')[1];
                    currentImageBase64 = dataUrl.split(',')[1];
                };
                reader.readAsDataURL(file);
                
                if (e.target.tagName === 'TEXTAREA') {
                    e.preventDefault();
                }
                break;
            }
        }
    });

    // Web Speech API (Speech to Text)
    const micBtn = document.getElementById('micBtn');
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            micBtn.classList.add('recording');
        };

        recognition.onresult = function(event) {
            const text = event.results[0][0].transcript;
            const textarea = document.getElementById('mathProblem');
            textarea.value = (textarea.value + ' ' + text).trim();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
        };

        recognition.onend = function() {
            micBtn.classList.remove('recording');
        };

        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('recording')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        micBtn.style.display = 'none'; // Không hỗ trợ
    }

    // Text to Speech
    const speakBtn = document.getElementById('speakBtn');
    speakBtn.addEventListener('click', () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); // Stop if speaking
            return;
        }
        const textToRead = document.getElementById('solutionContent').innerText;
        if (!textToRead) return;
        
        currentUtterance = new SpeechSynthesisUtterance(textToRead);
        currentUtterance.lang = 'vi-VN';
        window.speechSynthesis.speak(currentUtterance);
    });

    // PDF Export
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    exportPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('solutionBox');
        const opt = {
            margin:       10,
            filename:     'LoiGiai_AIGiaSu.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    // Render KaTeX in marked.js if available
    if (typeof marked !== 'undefined') {
        const renderer = new marked.Renderer();
        const originalParagraph = renderer.paragraph.bind(renderer);
        renderer.paragraph = function (text) {
            return originalParagraph(text);
        };
        marked.setOptions({
            renderer: renderer
        });
    }
});

async function updateUsageDisplay() {
    if (!currentUser || currentUser.role === 'admin') return;
    
    // currentUser là object từ db-firebase (có chứa uid, dailyLimit)
    const todayUsage = await DB.getTodayUsage(currentUser.uid);
    const limit = currentUser.dailyLimit;
    
    document.getElementById('usageCount').textContent = todayUsage;
    document.getElementById('usageLimit').textContent = limit;

    const badge = document.getElementById('usageBadge');
    if (todayUsage >= limit) {
        badge.style.background = 'rgba(239, 68, 68, 0.2)';
        badge.style.color = '#fca5a5';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    } else {
        badge.style.background = 'rgba(236, 72, 153, 0.2)';
        badge.style.color = '#fbcfe8';
        badge.style.borderColor = 'rgba(236, 72, 153, 0.3)';
    }

    await loadHistory(); // Update history list
}

// History Functions
async function saveToHistory(problem, solution) {
    if (!currentUser) return;
    await DB.saveHistory(currentUser.uid, problem, solution);
    await loadHistory();
}

async function loadHistory() {
    const listEl = document.getElementById('historyList');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (!currentUser) return;
    
    const userHistory = await DB.getHistory(currentUser.uid);
    
    if (userHistory.length === 0) {
        listEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:10px;">Chưa có lịch sử giải bài.</p>';
        return;
    }

    userHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const date = new Date(item.date).toLocaleString('vi-VN');
        div.innerHTML = `
            <div class="date">${date}</div>
            <div class="text">${item.problem}</div>
        `;
        
        div.addEventListener('click', () => {
            renderSolution(item.solution);
        });
        
        listEl.appendChild(div);
    });
}

function renderSolution(solution) {
    const solutionEl = document.getElementById('solutionContent');
    document.getElementById('resultTools').classList.remove('hidden');

    if (typeof marked !== 'undefined') {
        solutionEl.innerHTML = marked.parse(solution);
        // Render KaTeX for math formulas
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(solutionEl, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "\\[", right: "\\]", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false}
                ],
                throwOnError: false
            });
        }
    } else {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'inherit';
        pre.textContent = solution;
        solutionEl.innerHTML = '';
        solutionEl.appendChild(pre);
    }
}

async function callGeminiAPI(problem, selectedClass) {
    const url = '/api/gemini';
    const payload = {
        problem,
        selectedClass,
        imageBase64: currentImageBase64,
        imageMimeType: currentImageMimeType
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Lỗi từ Server');
    }

    return data.solution;
}

async function handleSolveMath() {
    if (!currentUser || currentUser.role === 'admin') return;

    const todayUsage = await DB.getTodayUsage(currentUser.uid);
    if (todayUsage >= currentUser.dailyLimit) {
        showMathError('Bạn đã hết lượt trong hôm nay.');
        return;
    }

    const problem = document.getElementById('mathProblem').value.trim();
    if (!problem && !currentImageBase64) {
        showMathError('Vui lòng nhập đề hoặc tải ảnh/vẽ hình.');
        return;
    }

    const selectedClass = document.getElementById('classSelect').value;
    document.getElementById('mathError').textContent = '';
    
    const solutionEl = document.getElementById('solutionContent');
    solutionEl.innerHTML = ''; 
    document.getElementById('resultTools').classList.add('hidden');
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.getElementById('solveBtn').disabled = true;

    try {
        const solution = await callGeminiAPI(problem, selectedClass);
        
        await DB.incrementUsage(currentUser.uid);
        await updateUsageDisplay();
        
        // Save to History
        await saveToHistory(problem, solution);

        // Render
        renderSolution(solution);

    } catch (error) {
        showMathError('Lỗi kết nối AI!');
        solutionEl.innerHTML = `<h3 style="color:red">Lỗi chi tiết:</h3><pre style="color:red; background:#fee2e2; padding:10px; overflow:auto">${error.message}</pre>`;
    } finally {
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('solveBtn').disabled = false;
    }
}

function showMathError(msg) {
    document.getElementById('mathError').textContent = msg;
}

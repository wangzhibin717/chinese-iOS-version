document.addEventListener('DOMContentLoaded', () => {
    let currentQuestionIndex = 0;
    let score = 0;
    let writer = null;
    let isQuizzing = false;
    let currentMode = 'write-character'; // 'write-character' or 'write-pinyin'

    // DOM Elements
    const pinyinEl = document.getElementById('pinyin');
    const meaningEl = document.getElementById('meaning');
    const wordHintEl = document.getElementById('word-hint');
    const feedbackEl = document.getElementById('feedback-area');
    const currentIndexEl = document.getElementById('current-index');
    const totalCountEl = document.getElementById('total-count');
    const scoreCountEl = document.getElementById('score-count');
    const pronounceBtn = document.getElementById('pronounce-btn');
    const animateBtn = document.getElementById('animate-btn');
    const restartBtn = document.getElementById('restart-btn');
    const nextBtn = document.getElementById('next-btn');
    const targetDiv = document.getElementById('character-target-div');
    const modeSelect = document.getElementById('mode-select');

    // New DOM Elements for Pinyin Mode
    const pinyinPromptContainer = document.getElementById('pinyin-prompt-container');
    const characterPromptContainer = document.getElementById('character-prompt-container');
    const characterDisplay = document.getElementById('character-display');
    const pinyinInputContainer = document.getElementById('pinyin-input-container');
    const pinyinInput = document.getElementById('pinyin-input');
    const checkPinyinBtn = document.getElementById('check-pinyin-btn');

    // Import Modal Elements
    const importBtn = document.getElementById('import-btn');
    const importModal = document.getElementById('import-modal');
    const closeImportBtn = document.querySelector('.close-btn');
    const confirmImportBtn = document.getElementById('confirm-import-btn');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const importText = document.getElementById('import-text');

    let currentHints = [];

    // Initialize
    // Shuffle quizData
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Shuffle the data before using it
    quizData = shuffleArray(quizData);

    totalCountEl.textContent = quizData.length;
    
    // Initial Load
    loadQuestion(currentQuestionIndex);
    
    // Background pinyin generation
    setTimeout(() => {
        quizData.forEach(item => {
             if (!item.pinyin && typeof pinyinPro !== 'undefined') {
                 try {
                     item.pinyin = pinyinPro.pinyin(item.character);
                 } catch (e) {
                     item.pinyin = '...';
                 }
             }
        });
    }, 100);

    // Mode Switch Listener
    modeSelect.addEventListener('change', (e) => {
        currentMode = e.target.value;
        // Reset score and index when switching modes
        currentQuestionIndex = 0;
        score = 0;
        scoreCountEl.textContent = score;
        loadQuestion(currentQuestionIndex);
    });

    // Import Modal Event Listeners
    importBtn.addEventListener('click', () => {
        importModal.style.display = 'flex';
        importText.value = '';
        importText.focus();
    });

    const closeModal = () => {
        importModal.style.display = 'none';
    };

    closeImportBtn.addEventListener('click', closeModal);
    cancelImportBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (event) => {
        if (event.target === importModal) {
            closeModal();
        }
    });

    confirmImportBtn.addEventListener('click', () => {
        const text = importText.value.trim();
        if (!text) {
            alert('请输入内容！');
            return;
        }

        try {
            let newData = [];
            
            // Try parsing as JSON first
            if (text.startsWith('[') || text.startsWith('{')) {
                try {
                    const parsed = JSON.parse(text);
                    if (Array.isArray(parsed)) {
                        newData = parsed;
                    } else {
                        newData = [parsed];
                    }
                } catch (e) {
                    newData = parseTextToQuizData(text);
                }
            } else {
                newData = parseTextToQuizData(text);
            }

            if (newData.length === 0) {
                alert('未能解析出有效的汉字，请重试。');
                return;
            }

            // Update Global Data
            quizData = newData; 
            
            // Reset Quiz
            currentQuestionIndex = 0;
            score = 0;
            scoreCountEl.textContent = score;
            totalCountEl.textContent = quizData.length;
            loadQuestion(currentQuestionIndex);
            
            closeModal();
            alert(`成功导入 ${newData.length} 个生字！`);

        } catch (err) {
            console.error(err);
            alert('导入出错，请检查格式。');
        }
    });

    function parseTextToQuizData(text) {
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
        if (!chineseChars) return [];

        return chineseChars.map(char => {
            let pinyinStr = '';
            try {
                if (typeof pinyinPro !== 'undefined') {
                    pinyinStr = pinyinPro.pinyin(char);
                } else {
                    console.warn('pinyin-pro library not loaded');
                }
            } catch (e) {
                console.error('Error generating pinyin:', e);
            }

            return {
                character: char,
                pinyin: pinyinStr || '...',
                meaning: '自定义导入'
            };
        });
    }

    // Event Listeners
    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        } else {
            alert(`练习结束！你的得分是: ${score} / ${quizData.length}`);
            currentQuestionIndex = 0;
            score = 0;
            scoreCountEl.textContent = score;
            loadQuestion(currentQuestionIndex);
        }
    });

    restartBtn.addEventListener('click', () => {
        if (currentMode === 'write-character') {
            startQuiz();
        } else {
            // Reset input
            pinyinInput.value = '';
            pinyinInput.focus();
            feedbackEl.textContent = '请输入拼音';
            feedbackEl.className = 'feedback';
            nextBtn.disabled = true;
        }
    });

    animateBtn.addEventListener('click', () => {
        if (currentMode === 'write-character') {
            if (writer) {
                animateBtn.disabled = true;
                writer.animateCharacter({
                    onComplete: function() {
                        animateBtn.disabled = false;
                        startQuiz(); 
                    }
                });
            }
        } else {
             alert('拼音模式下暂不支持笔画演示，请切换模式。');
        }
    });

    pronounceBtn.addEventListener('click', () => {
        if (currentHints.length > 0) {
            speakText(currentHints.join('，'));
        } else {
            speakText(quizData[currentQuestionIndex].character);
        }
    });
    
    // Check Pinyin Button
    checkPinyinBtn.addEventListener('click', checkPinyinAnswer);
    pinyinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPinyinAnswer();
        }
    });

    function checkPinyinAnswer() {
        const input = pinyinInput.value.trim().toLowerCase();
        if (!input) return;

        const data = quizData[currentQuestionIndex];
        const correctPinyin = data.pinyin.toLowerCase(); 
        
        let isCorrect = false;
        
        // 1. Exact match (nǐ)
        if (input === correctPinyin) {
            isCorrect = true;
        } 
        
        // 2. Number match (ni3)
        if (!isCorrect && typeof pinyinPro !== 'undefined') {
            try {
                const pinyinNum = pinyinPro.pinyin(data.character, { toneType: 'num' }).toLowerCase(); // ni3
                if (input === pinyinNum) {
                    isCorrect = true;
                }
            } catch(e) { console.error(e); }
        }

        // 3. None match (ni) - Partial credit or wrong? 
        // Let's mark as wrong but give a hint if they missed tone.
        if (!isCorrect && typeof pinyinPro !== 'undefined') {
            try {
                const pinyinNone = pinyinPro.pinyin(data.character, { toneType: 'none' }).toLowerCase(); // ni
                if (input === pinyinNone) {
                     feedbackEl.textContent = '声调错误。正确答案: ' + correctPinyin;
                     feedbackEl.className = 'feedback wrong';
                     return;
                }
            } catch(e) {}
        }

        if (isCorrect) {
            feedbackEl.textContent = '回答正确！🎉 (' + correctPinyin + ')';
            feedbackEl.className = 'feedback correct';
            nextBtn.disabled = false;
            // Only score if not already answered correctly? 
            // Simplified: always score, but UI prevents multiple clicks slightly.
            // But user can click 'check' multiple times. 
            // We should disable input/button?
            // Let's just update score once per question ideally, but here simpler is fine.
            // Let's check if button is already disabled (meaning already correct, wait, button isn't disabled)
            // nextBtn is disabled until correct.
            if (nextBtn.disabled) { // It was disabled, so this is first correct answer
                 score++;
                 scoreCountEl.textContent = score;
            }
            nextBtn.disabled = false;
            
        } else {
            feedbackEl.textContent = '错误。正确答案: ' + correctPinyin;
            feedbackEl.className = 'feedback wrong';
        }
    }

    function loadQuestion(index) {
        const data = quizData[index];
        
        // Ensure pinyin exists
        if (!data.pinyin && typeof pinyinPro !== 'undefined') {
             try {
                 data.pinyin = pinyinPro.pinyin(data.character);
             } catch (e) {
                 data.pinyin = '...';
             }
        }
        
        // Common UI updates
        currentIndexEl.textContent = index + 1;
        nextBtn.disabled = true;
        
        // Hints generation (Shared)
        let wordHintText = '';
        currentHints = [];
        if (typeof cnchar !== 'undefined') {
             try {
                 const hints = [];
                 let twoCharWords = [];
                 if (typeof cnchar.words === 'function') {
                     const words = cnchar.words(data.character);
                     if (Array.isArray(words)) {
                         twoCharWords = words.filter(w => w.length === 2 && w.includes(data.character));
                     }
                 }
                 let fourCharIdioms = [];
                 if (cnchar.idiom) {
                     const idioms = cnchar.idiom(data.character) || [];
                     if (Array.isArray(idioms)) {
                         fourCharIdioms = idioms.filter(i => i.length === 4);
                     }
                 }
                 for (let i = 0; i < 2 && i < twoCharWords.length; i++) hints.push(twoCharWords[i]);
                 if (fourCharIdioms.length > 0) hints.push(fourCharIdioms[0]);
                 const targetCount = 3;
                 if (hints.length < targetCount) {
                     for (let i = 1; i < fourCharIdioms.length && hints.length < targetCount; i++) {
                         if (!hints.includes(fourCharIdioms[i])) hints.push(fourCharIdioms[i]);
                     }
                 }
                 if (hints.length < targetCount) {
                     for (let i = 2; i < twoCharWords.length && hints.length < targetCount; i++) {
                         if (!hints.includes(twoCharWords[i])) hints.push(twoCharWords[i]);
                     }
                 }
                 if (hints.length > 0) {
                     currentHints = hints;
                     const hintStr = hints.join('、');
                     const maskedHint = hintStr.replaceAll(data.character, '（ ）');
                     wordHintText = '组词: ' + maskedHint;
                 }
             } catch (e) {
                 console.error('Error getting word hint:', e);
             }
        }
        wordHintEl.textContent = wordHintText;

        // Mode Specific Logic
        if (currentMode === 'write-character') {
            // Show Pinyin Prompt
            pinyinPromptContainer.style.display = 'block';
            characterPromptContainer.style.display = 'none';
            
            // Show Writer
            targetDiv.style.display = 'block';
            pinyinInputContainer.style.display = 'none';
            
            // Update Text
            pinyinEl.textContent = data.pinyin;
            meaningEl.textContent = data.meaning;
            feedbackEl.textContent = '请在米字格中书写';
            feedbackEl.className = 'feedback';
            
            // Init Writer
            if (writer) targetDiv.innerHTML = '';
            writer = HanziWriter.create('character-target-div', data.character, {
                width: 300,
                height: 300,
                padding: 5,
                showOutline: false,
                showCharacter: false,
                strokeColor: '#333',
                radicalColor: '#168F16'
            });
            startQuiz();

        } else {
            // WRITE PINYIN MODE
            // Show Character Prompt
            pinyinPromptContainer.style.display = 'none';
            characterPromptContainer.style.display = 'block';
            
            // Show Input
            targetDiv.style.display = 'none';
            pinyinInputContainer.style.display = 'flex'; 
            
            // Update Text
            characterDisplay.textContent = data.character;
            feedbackEl.textContent = '请输入拼音';
            feedbackEl.className = 'feedback';
            pinyinInput.value = '';
            pinyinInput.focus();
        }
    }

    function startQuiz() {
        if (!writer || currentMode !== 'write-character') return;
        
        isQuizzing = true;
        writer.quiz({
            onMistake: function(strokeData) {
                feedbackEl.textContent = '笔画错误，请重试';
                feedbackEl.className = 'feedback wrong';
            },
            onCorrectStroke: function(strokeData) {
                feedbackEl.textContent = '笔画正确！继续...';
                feedbackEl.className = 'feedback';
            },
            onComplete: function(summaryData) {
                feedbackEl.textContent = '书写正确！🎉';
                feedbackEl.className = 'feedback correct';
                nextBtn.disabled = false;
                isQuizzing = false;
                if (feedbackEl.textContent.includes('🎉')) {
                     score++;
                     scoreCountEl.textContent = score;
                }
                writer.showCharacter();
            }
        });
    }

    function speakText(text) {
        if ('speechSynthesis' in window) {
            // iOS Safari requires cancelling before speaking to avoid getting stuck
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8; // Slightly slower for clarity

            // Try to set a Chinese voice explicitly if available
            const voices = window.speechSynthesis.getVoices();
            // Prefer "Ting-Ting" or any zh-CN voice
            const zhVoice = voices.find(v => v.lang === 'zh-CN' || v.lang === 'zh-HK' || v.lang === 'zh-TW');
            if (zhVoice) {
                utterance.voice = zhVoice;
            }

            utterance.onerror = function(event) {
                console.error('SpeechSynthesis error', event);
            };

            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Browser does not support TTS');
            alert('您的浏览器不支持朗读功能');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    let currentQuestionIndex = 0;
    let score = 0;
    let writer = null;
    let isQuizzing = false;
    let currentMode = 'write-character'; // 'write-character', 'write-pinyin', 'quiz-20'
    let isQuizMode = false;
    let quiz20Data = [];

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
    const closeImportBtn = document.getElementById('import-close-btn');
    const confirmImportBtn = document.getElementById('confirm-import-btn');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const importText = document.getElementById('import-text');

    const demoCountEl = document.getElementById('demo-count');
    const demoPracticeBtn = document.getElementById('demo-practice-btn');
    const demoClearBtn = document.getElementById('demo-clear-btn');
    const demoPracticeStatusEl = document.getElementById('demo-practice-status');
    const demoExitBtn = document.getElementById('demo-exit-btn');

    const demoModal = document.getElementById('demo-modal');
    const demoCloseBtn = document.getElementById('demo-close-btn');
    const demoCountModalEl = document.getElementById('demo-count-modal');
    const demoSelectAllBtn = document.getElementById('demo-select-all-btn');
    const demoClearSelectBtn = document.getElementById('demo-clear-select-btn');
    const demoListEl = document.getElementById('demo-list');
    const demoStartBtn = document.getElementById('demo-start-btn');
    const demoCancelBtn = document.getElementById('demo-cancel-btn');

    let currentHints = [];

    // Initialize
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const DEMO_STORAGE_KEY = 'cd_demo_chars';
    const PRACTICE_STORAGE_KEY = 'cd_demo_practice_chars';
    const PRACTICE_ENABLED_KEY = 'cd_demo_practice_enabled';

    const storageAvailable = (() => {
        try {
            const k = '__cd_test__';
            localStorage.setItem(k, '1');
            localStorage.removeItem(k);
            return true;
        } catch (e) {
            return false;
        }
    })();

    function loadArrayFromStorage(key) {
        if (!storageAvailable) return [];
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveArrayToStorage(key, value) {
        if (!storageAvailable) return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    function loadBoolFromStorage(key) {
        if (!storageAvailable) return false;
        return localStorage.getItem(key) === '1';
    }

    function saveBoolToStorage(key, value) {
        if (!storageAvailable) return;
        localStorage.setItem(key, value ? '1' : '0');
    }

    let baseQuizData = Array.isArray(quizData) ? quizData.slice() : [];
    let baseQuizMap = new Map(baseQuizData.map(item => [item.character, item]));

    let demoCharSet = new Set(loadArrayFromStorage(DEMO_STORAGE_KEY));
    let practiceEnabled = loadBoolFromStorage(PRACTICE_ENABLED_KEY);
    let practiceCharSet = new Set(loadArrayFromStorage(PRACTICE_STORAGE_KEY));

    function updateDemoUI() {
        if (demoCountEl) demoCountEl.textContent = String(getAvailableDemoChars().length);
        if (demoCountModalEl) demoCountModalEl.textContent = String(getAvailableDemoChars().length);
        if (demoPracticeStatusEl) demoPracticeStatusEl.style.display = practiceEnabled ? 'inline-flex' : 'none';
    }

    function setBaseData(newData) {
        baseQuizData = Array.isArray(newData) ? newData.slice() : [];
        baseQuizMap = new Map(baseQuizData.map(item => [item.character, item]));
    }

    function applyQuizData(newData) {
        quizData = Array.isArray(newData) ? newData.slice() : [];
        shuffleArray(quizData);
        currentQuestionIndex = 0;
        score = 0;
        scoreCountEl.textContent = score;
        totalCountEl.textContent = quizData.length;
        loadQuestion(currentQuestionIndex);
    }

    function getAvailableDemoChars() {
        const available = [];
        for (const ch of demoCharSet) {
            if (baseQuizMap.has(ch)) available.push(ch);
        }
        return available;
    }

    function buildQuizDataFromChars(chars) {
        return chars
            .filter(Boolean)
            .map(ch => {
                const base = baseQuizMap.get(ch);
                if (base) {
                    return { character: base.character, pinyin: base.pinyin || '', meaning: base.meaning || '' };
                }
                return { character: ch, pinyin: '', meaning: '' };
            });
    }

    function recordDemoChar(char) {
        if (!char) return;
        demoCharSet.add(char);
        saveArrayToStorage(DEMO_STORAGE_KEY, Array.from(demoCharSet));
        updateDemoUI();
    }

    function openDemoModal() {
        const chars = getAvailableDemoChars().sort((a, b) => a.localeCompare(b, 'zh-CN'));
        if (chars.length === 0) {
            alert('还没有记录到演示过的字。请先点击“演示笔画”。');
            return;
        }

        demoListEl.innerHTML = '';

        const selected = new Set(
            Array.from(practiceCharSet).filter(ch => chars.includes(ch))
        );
        const effectiveSelected = selected.size > 0 ? selected : new Set(chars);

        for (const ch of chars) {
            const label = document.createElement('label');
            label.className = 'demo-item';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = ch;
            input.checked = effectiveSelected.has(ch);

            const span = document.createElement('span');
            span.className = 'demo-char';
            span.textContent = ch;

            label.appendChild(input);
            label.appendChild(span);
            demoListEl.appendChild(label);
        }

        demoCountModalEl.textContent = String(chars.length);
        demoModal.style.display = 'flex';
    }

    function closeDemoModal() {
        demoModal.style.display = 'none';
    }

    function exitDemoPractice() {
        practiceEnabled = false;
        practiceCharSet = new Set();
        saveBoolToStorage(PRACTICE_ENABLED_KEY, false);
        saveArrayToStorage(PRACTICE_STORAGE_KEY, []);
        updateDemoUI();
        applyQuizData(baseQuizData);
    }

    updateDemoUI();
    
    // Initial Load
    if (practiceEnabled) {
        const availableDemo = getAvailableDemoChars();
        const selected = Array.from(practiceCharSet).filter(ch => availableDemo.includes(ch));
        if (selected.length > 0) {
            applyQuizData(buildQuizDataFromChars(selected));
        } else if (availableDemo.length > 0) {
            applyQuizData(buildQuizDataFromChars(availableDemo));
        } else {
            practiceEnabled = false;
            saveBoolToStorage(PRACTICE_ENABLED_KEY, false);
            applyQuizData(baseQuizData);
        }
    } else {
        applyQuizData(baseQuizData);
    }
    
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
        
        if (currentMode === 'quiz-20') {
            startQuiz20();
        } else {
            isQuizMode = false;
            // Restore full data if we were in quiz mode
            // Actually, applyQuizData resets everything, so we just re-apply base data
            // But wait, if user imported data, baseQuizData holds it.
            // So we just re-apply baseQuizData.
            applyQuizData(baseQuizData);
        }
    });

    function startQuiz20() {
        if (baseQuizData.length < 20) {
            alert(`题库只有 ${baseQuizData.length} 个字，将全部用于测验。`);
        }
        isQuizMode = true;
        
        // Pick random 20
        const shuffled = baseQuizData.slice();
        shuffleArray(shuffled);
        quiz20Data = shuffled.slice(0, 20);
        
        // Reset state
        currentQuestionIndex = 0;
        score = 0;
        scoreCountEl.textContent = score;
        totalCountEl.textContent = quiz20Data.length;
        
        // Load first question (defaulting to write-character style for quiz)
        // Or should quiz mode force a specific interaction style? 
        // Let's assume Quiz 20 is "Write Character" test.
        loadQuestion(currentQuestionIndex, quiz20Data);
    }

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
        if (event.target === demoModal) {
            closeDemoModal();
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
            practiceEnabled = false;
            practiceCharSet = new Set();
            saveBoolToStorage(PRACTICE_ENABLED_KEY, false);
            saveArrayToStorage(PRACTICE_STORAGE_KEY, []);
            setBaseData(newData);
            quizData = newData;
            
            applyQuizData(baseQuizData);
            updateDemoUI();
            
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
        const activeData = isQuizMode ? quiz20Data : quizData;
        
        if (currentQuestionIndex < activeData.length - 1) {
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex, activeData);
        } else {
            const finalScore = score;
            const total = activeData.length;
            const percentage = Math.round((finalScore / total) * 100);
            
            let msg = `练习结束！得分: ${finalScore} / ${total}`;
            if (isQuizMode) {
                msg = `小测验结束！\n得分: ${finalScore} / ${total}\n正确率: ${percentage}%`;
                if (percentage >= 90) msg += "\n太棒了！🌟";
                else if (percentage >= 60) msg += "\n继续加油！💪";
            }
            
            alert(msg);
            
            if (isQuizMode) {
                // End quiz mode? Or restart?
                // Let's reset to start
                currentQuestionIndex = 0;
                score = 0;
                scoreCountEl.textContent = score;
                // Reshuffle for new quiz? Or same?
                // Let's keep same for review, user can re-select mode to reshuffle
                loadQuestion(currentQuestionIndex, activeData);
            } else {
                currentQuestionIndex = 0;
                score = 0;
                scoreCountEl.textContent = score;
                loadQuestion(currentQuestionIndex);
            }
        }
    });

    restartBtn.addEventListener('click', () => {
        if (currentMode === 'write-character' || currentMode === 'quiz-20') {
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
        if (currentMode === 'write-character' || currentMode === 'quiz-20') {
            if (writer) {
                const activeData = isQuizMode ? quiz20Data : quizData;
                recordDemoChar(activeData[currentQuestionIndex]?.character);
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
        const activeData = isQuizMode ? quiz20Data : quizData;
        if (currentHints.length > 0) {
            speakText(currentHints.join('，'));
        } else {
            speakText(activeData[currentQuestionIndex].character);
        }
    });

    demoPracticeBtn.addEventListener('click', openDemoModal);
    demoCloseBtn.addEventListener('click', closeDemoModal);
    demoCancelBtn.addEventListener('click', closeDemoModal);

    demoSelectAllBtn.addEventListener('click', () => {
        const inputs = demoListEl.querySelectorAll('input[type="checkbox"]');
        inputs.forEach(i => { i.checked = true; });
    });

    demoClearSelectBtn.addEventListener('click', () => {
        const inputs = demoListEl.querySelectorAll('input[type="checkbox"]');
        inputs.forEach(i => { i.checked = false; });
    });

    demoStartBtn.addEventListener('click', () => {
        const checked = Array.from(demoListEl.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
        if (checked.length === 0) {
            alert('请至少选择一个字。');
            return;
        }
        practiceEnabled = true;
        practiceCharSet = new Set(checked);
        saveBoolToStorage(PRACTICE_ENABLED_KEY, true);
        saveArrayToStorage(PRACTICE_STORAGE_KEY, checked);
        updateDemoUI();
        closeDemoModal();
        applyQuizData(buildQuizDataFromChars(checked));
    });

    demoExitBtn.addEventListener('click', exitDemoPractice);
    demoClearBtn.addEventListener('click', () => {
        const ok = confirm('确定清空“演示笔画”记录吗？');
        if (!ok) return;
        demoCharSet = new Set();
        saveArrayToStorage(DEMO_STORAGE_KEY, []);
        if (practiceEnabled) {
            exitDemoPractice();
        } else {
            updateDemoUI();
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

        const activeData = isQuizMode ? quiz20Data : quizData;
        const data = activeData[currentQuestionIndex];
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

    function loadQuestion(index, dataSource) {
        const data = (dataSource || quizData)[index];
        
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
                         // Filter 2-char words
                         twoCharWords = words.filter(w => w.length === 2 && w.includes(data.character));
                         
                         // If no 2-char words found (e.g. for particles like 吗, 呀), try finding any words
                         if (twoCharWords.length === 0) {
                             twoCharWords = words.filter(w => w.length >= 2 && w.includes(data.character));
                         }
                     }
                 }
                 // Fallback: Use idiom if word search failed or try simple words
                 if (twoCharWords.length === 0) {
                     // Try to get some common words even if not strictly 2-chars
                     // Or use fixed common words for particles
                     const commonParticles = {
                         '吗': ['好吗', '是吗', '干吗'],
                         '呀': ['哎呀', '是呀', '好呀'],
                         '呢': ['你呢', '他呢', '早呢'],
                         '吧': ['好吧', '走吧', '酒吧'],
                         '啊': ['好啊', '是啊', '走啊']
                     };
                     if (commonParticles[data.character]) {
                         twoCharWords = commonParticles[data.character];
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
        if (currentMode === 'write-character' || currentMode === 'quiz-20') {
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
        if (!writer || (currentMode !== 'write-character' && currentMode !== 'quiz-20')) return;
        
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
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8;

            let voices = window.speechSynthesis.getVoices();
            
            const setVoice = () => {
                voices = window.speechSynthesis.getVoices();
                let zhVoice = voices.find(v => v.name.includes('Ting-Ting') || v.name.includes('Yaoyao') || v.name.includes('HiuGaai'));
                
                if (!zhVoice) {
                    zhVoice = voices.find(v => v.lang === 'zh-CN');
                }
                
                if (!zhVoice) {
                    zhVoice = voices.find(v => v.lang.includes('zh'));
                }

                if (zhVoice) {
                    utterance.voice = zhVoice;
                }
                
                setTimeout(() => {
                    window.speechSynthesis.speak(utterance);
                }, 10);
            };

            if (voices.length === 0) {
                const onVoicesChanged = () => {
                    window.speechSynthesis.onvoiceschanged = null;
                    setVoice();
                };
                window.speechSynthesis.onvoiceschanged = onVoicesChanged;
                
                setTimeout(() => {
                    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
                    window.speechSynthesis.speak(utterance);
                }, 500);
            } else {
                setVoice();
            }

            utterance.onerror = function(event) {
                console.error('SpeechSynthesis error', event);
            };
        } else {
            console.log('Browser does not support TTS');
            alert('您的浏览器不支持朗读功能');
        }
    }
});

class GameTimer {
    constructor() {
        this.timeInput = document.getElementById('time-input');
        this.warningTimesContainer = document.getElementById('warning-times-container');
        this.addWarningButton = document.getElementById('add-warning');
        this.startButton = document.getElementById('start-button');
        this.resetButton = document.getElementById('reset-button');
        this.backButton = document.getElementById('back-button');
        this.pauseButton = document.getElementById('pause-button');
        this.timerDisplay = document.getElementById('timer-display');
        this.setupScreen = document.getElementById('setup-screen');
        this.timerScreen = document.getElementById('timer-screen');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        
        this.initialTime = 0;
        this.timeLeft = 0;
        this.warningTimes = new Set();
        this.playedWarnings = new Set();
        this.timerInterval = null;
        this.isPaused = false;
        this.flashInterval = null;
        
        // Initialize audio context and speech synthesis
        this.audioContext = null;
        this.speechSynthesis = window.speechSynthesis;
        this.speechQueue = [];
        this.isSpeaking = false;
        this.lastSpeechTime = 0;
        
        // Initialize dark mode from localStorage
        this.initializeDarkMode();
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.startButton.addEventListener('click', () => this.startTimer());
        this.resetButton.addEventListener('click', () => this.resetTimer());
        this.backButton.addEventListener('click', () => this.showSetup());
        this.addWarningButton.addEventListener('click', () => this.addWarningTime());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        
        // Add initial warning time input event listeners
        this.setupWarningTimeListeners();
        
        // Initialize audio on first user interaction
        document.addEventListener('click', () => this.initializeAudio(), { once: true });
        
        // Handle speech synthesis events
        this.speechSynthesis.onend = () => this.processSpeechQueue();
        this.speechSynthesis.onerror = (event) => {
            console.error('Speech error:', event);
            this.processSpeechQueue();
        };
        
        // Add dark mode toggle event
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
    }
    
    initializeAudio() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                // Test audio
                this.playTestSound();
                // Test speech
                this.speak("Timer ready");
            } catch (e) {
                console.error('Audio initialization failed:', e);
            }
        }
    }
    
    playTestSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.error('Test sound failed:', e);
        }
    }
    
    speak(text) {
        console.log('Attempting to speak:', text);
        
        // Add to queue
        this.speechQueue.push(text);
        
        // If not currently speaking, start processing queue
        if (!this.isSpeaking) {
            this.processSpeechQueue();
        }
    }
    
    processSpeechQueue() {
        if (this.speechQueue.length === 0) {
            this.isSpeaking = false;
            return;
        }
        
        // Prevent too frequent speech
        const now = Date.now();
        if (now - this.lastSpeechTime < 1000) {
            setTimeout(() => this.processSpeechQueue(), 1000);
            return;
        }
        
        this.isSpeaking = true;
        const text = this.speechQueue.shift();
        this.lastSpeechTime = now;
        
        try {
            // Cancel any ongoing speech
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Try to use a voice that's available on iOS
            const voices = this.speechSynthesis.getVoices();
            console.log('Available voices:', voices.map(v => v.name));
            
            const preferredVoice = voices.find(voice => 
                voice.name.includes('Samantha') || 
                voice.name.includes('Karen') || 
                voice.name.includes('Daniel')
            );
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
                console.log('Using voice:', preferredVoice.name);
            }
            
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // iOS specific: ensure speech starts
            utterance.onstart = () => {
                console.log('Speech started:', text);
                // Resume audio context if it was suspended
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            };
            
            utterance.onend = () => {
                console.log('Speech ended:', text);
                this.processSpeechQueue();
            };
            
            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                this.processSpeechQueue();
            };
            
            // iOS specific: ensure speech synthesis is active
            if (this.speechSynthesis.paused) {
                this.speechSynthesis.resume();
            }
            
            this.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Speech failed:', e);
            // If speech fails, try to process next item in queue
            setTimeout(() => this.processSpeechQueue(), 1000);
        }
    }
    
    setupWarningTimeListeners() {
        // Remove existing listeners
        const removeButtons = this.warningTimesContainer.querySelectorAll('.remove-warning');
        removeButtons.forEach(button => {
            button.removeEventListener('click', this.handleRemoveWarning);
        });
        
        // Add new listeners
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleRemoveWarning(e));
        });
    }
    
    handleRemoveWarning(event) {
        const warningInput = event.target.closest('.warning-time-input');
        if (warningInput) {
            warningInput.remove();
        }
    }
    
    addWarningTime() {
        const warningTimeDiv = document.createElement('div');
        warningTimeDiv.className = 'warning-time-input';
        warningTimeDiv.innerHTML = `
            <input type="number" class="warning-time" min="0" max="60" value="30">
            <button class="remove-warning" title="Remove warning">×</button>
        `;
        this.warningTimesContainer.appendChild(warningTimeDiv);
        this.setupWarningTimeListeners();
    }
    
    getWarningTimes() {
        const warningInputs = this.warningTimesContainer.querySelectorAll('.warning-time');
        const times = new Set();
        warningInputs.forEach(input => {
            const time = parseInt(input.value);
            if (!isNaN(time) && time > 0 && time <= 60) {
                times.add(time);
            }
        });
        return times;
    }
    
    startTimer() {
        // Ensure audio is initialized
        this.initializeAudio();
        
        const minutes = parseInt(this.timeInput.value);
        const warningTimes = this.getWarningTimes();
        
        if (isNaN(minutes) || minutes < 1 || minutes > 60) {
            alert('Please enter a valid time between 1 and 60 minutes');
            return;
        }
        
        this.initialTime = minutes * 60;
        this.timeLeft = this.initialTime;
        this.warningTimes = warningTimes;
        this.playedWarnings.clear();
        this.isPaused = false;
        this.updatePauseButton();
        this.showTimer();
        this.updateDisplay();
        this.startCountdown();
    }
    
    resetTimer() {
        this.timeLeft = this.initialTime;
        this.playedWarnings.clear();
        this.isPaused = false;
        this.updatePauseButton();
        this.updateDisplay();
        // Remove time-up state
        document.body.classList.remove('flash', 'time-up');
        document.querySelector('.container').classList.remove('flash', 'time-up');
        this.startCountdown();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.updatePauseButton();
        
        if (this.isPaused) {
            this.stopCountdown();
        } else {
            this.startCountdown();
        }
    }
    
    updatePauseButton() {
        this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    showSetup() {
        this.stopCountdown();
        this.setupScreen.classList.remove('hidden');
        this.timerScreen.classList.add('hidden');
    }
    
    showTimer() {
        this.setupScreen.classList.add('hidden');
        this.timerScreen.classList.remove('hidden');
    }
    
    startCountdown() {
        this.stopCountdown();
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.timeLeft--;
                this.updateDisplay();
                this.updateBackgroundEffect();
                
                // Check for warning sounds
                if (this.warningTimes.has(this.timeLeft) && !this.playedWarnings.has(this.timeLeft)) {
                    console.log('Warning triggered at:', this.timeLeft);
                    this.playWarningSound();
                    this.playedWarnings.add(this.timeLeft);
                }
                
                if (this.timeLeft <= 0) {
                    this.playAlarm();
                    this.stopCountdown();
                    // Keep the red background at full intensity
                    document.body.style.setProperty('--flash-intensity', '1');
                    document.body.classList.add('flash', 'time-up');
                    document.querySelector('.container').classList.add('flash', 'time-up');
                }
            }
        }, 1000);
    }
    
    stopCountdown() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        // Only stop the background effect if we're not at time's up
        if (this.timeLeft > 0) {
            this.stopBackgroundEffect();
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    formatTimeForSpeech() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        if (minutes === 0) {
            return `${seconds} seconds`;
        } else if (seconds === 0) {
            return `${minutes} minutes`;
        } else {
            return `${minutes} minutes and ${seconds} seconds`;
        }
    }
    
    playWarningSound() {
        if (!this.audioContext) {
            this.initializeAudio();
            if (!this.audioContext) return;
        }
        
        try {
            // Play a short beep
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
            // Speak the remaining time
            const timeText = this.formatTimeForSpeech();
            console.log('Speaking warning time:', timeText);
            this.speak(timeText);
        } catch (e) {
            console.error('Warning sound failed:', e);
        }
    }
    
    playAlarm() {
        if (!this.audioContext) {
            this.initializeAudio();
            if (!this.audioContext) return;
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
            // Announce time's up
            this.speak("Time's up!");
        } catch (e) {
            console.error('Alarm sound failed:', e);
        }
    }
    
    updateBackgroundEffect() {
        if (this.timeLeft <= 15 && this.timeLeft > 0) {
            // Calculate opacity for the red flash (10% to 100%)
            const intensity = Math.min(1, (15 - this.timeLeft) / 10);
            const redIntensity = 0.1 + (intensity * 0.9); // Start at 10% and go up to 100%
            
            // Update the flash animation with the new intensity
            document.body.style.setProperty('--flash-intensity', redIntensity);
            
            // Start flashing if not already
            if (!document.body.classList.contains('flash')) {
                document.body.classList.add('flash');
                document.querySelector('.container').classList.add('flash');
            }
        } else {
            this.stopBackgroundEffect();
        }
    }
    
    stopBackgroundEffect() {
        document.body.classList.remove('flash');
        document.querySelector('.container').classList.remove('flash');
        document.body.style.setProperty('--flash-intensity', '0.1');
    }
    
    initializeDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.querySelector('.container').classList.add('dark-mode');
            document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
            document.documentElement.style.setProperty('--container-bg', '#2d2d2d');
        } else {
            document.documentElement.style.setProperty('--bg-color', '#f5f5f5');
            document.documentElement.style.setProperty('--container-bg', 'white');
        }
    }
    
    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        document.querySelector('.container').classList.toggle('dark-mode');
        if (isDarkMode) {
            document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
            document.documentElement.style.setProperty('--container-bg', '#2d2d2d');
        } else {
            document.documentElement.style.setProperty('--bg-color', '#f5f5f5');
            document.documentElement.style.setProperty('--container-bg', 'white');
        }
        localStorage.setItem('darkMode', isDarkMode);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GameTimer();
}); 
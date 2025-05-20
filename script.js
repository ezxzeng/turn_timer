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
        
        this.initialTime = 0;
        this.timeLeft = 0;
        this.warningTimes = new Set();
        this.playedWarnings = new Set();
        this.timerInterval = null;
        this.isPaused = false;
        
        // Initialize speech synthesis
        this.speechSynthesis = window.speechSynthesis;
        
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
                
                // Check for warning sounds
                if (this.warningTimes.has(this.timeLeft) && !this.playedWarnings.has(this.timeLeft)) {
                    this.playWarningSound();
                    this.playedWarnings.add(this.timeLeft);
                }
                
                if (this.timeLeft <= 0) {
                    this.playAlarm();
                    this.stopCountdown();
                }
            }
        }, 1000);
    }
    
    stopCountdown() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
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
        // Play a short beep
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Speak the remaining time
        const utterance = new SpeechSynthesisUtterance(this.formatTimeForSpeech());
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        // Speak the time
        this.speechSynthesis.speak(utterance);
    }
    
    playAlarm() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Announce time's up
        const utterance = new SpeechSynthesisUtterance("Time's up!");
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        this.speechSynthesis.speak(utterance);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GameTimer();
}); 
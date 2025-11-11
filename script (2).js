// Task Tracker Application
class TaskTracker {
    constructor() {
        this.currentCategory = 'work';
        this.tasks = this.loadTasks();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDate();
        this.renderTasks();
        this.updateStats();
        this.updateProgress();
        this.checkStreak();
    }

    setupEventListeners() {
        // Category tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchCategory(e.target.closest('.tab-button').dataset.category);
            });
        });

        // Add task
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // History modal
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.querySelector('.close-modal').addEventListener('click', () => this.closeHistory());
        
        // Sync button
        document.getElementById('syncBtn').addEventListener('click', () => this.syncData());

        // Close modal on outside click
        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target.id === 'historyModal') this.closeHistory();
        });
    }

    switchCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        this.renderTasks();
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (!text) return;

        const task = {
            id: Date.now().toString(),
            text: text,
            category: this.currentCategory,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        const today = this.getTodayKey();
        if (!this.tasks[today]) {
            this.tasks[today] = [];
        }
        
        this.tasks[today].push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        input.value = '';
        input.focus();
    }

    toggleTask(taskId) {
        const today = this.getTodayKey();
        const task = this.tasks[today]?.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.updateProgress();
        }
    }

    deleteTask(taskId) {
        const today = this.getTodayKey();
        if (this.tasks[today]) {
            this.tasks[today] = this.tasks[today].filter(t => t.id !== taskId);
            if (this.tasks[today].length === 0) {
                delete this.tasks[today];
            }
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.updateProgress();
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksList');
        const today = this.getTodayKey();
        const todayTasks = this.tasks[today] || [];
        const categoryTasks = todayTasks.filter(t => t.category === this.currentCategory);
        
        if (categoryTasks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p style="font-size: 18px; margin-bottom: 8px;">Нет задач</p>
                    <p style="font-size: 14px;">Добавьте первую задачу в категорию "${this.getCategoryName(this.currentCategory)}"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        categoryTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.dataset.taskId = task.id;
            
            const checkbox = document.createElement('div');
            checkbox.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
            checkbox.addEventListener('click', () => this.toggleTask(task.id));
            
            const text = document.createElement('span');
            text.className = `task-text ${task.completed ? 'completed' : ''}`;
            text.textContent = task.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            
            taskItem.appendChild(checkbox);
            taskItem.appendChild(text);
            taskItem.appendChild(deleteBtn);
            container.appendChild(taskItem);
        });
    }

    updateDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('ru-RU', options);
        
        document.getElementById('currentDate').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        
        const hour = now.getHours();
        let greeting = 'Добрый вечер';
        if (hour < 12) greeting = 'Доброе утро';
        else if (hour < 18) greeting = 'Добрый день';
        
        document.getElementById('greeting').textContent = `${greeting}! Время продуктивности`;
    }

    updateStats() {
        // Today's completed tasks
        const today = this.getTodayKey();
        const todayTasks = this.tasks[today] || [];
        const todayCompleted = todayTasks.filter(t => t.completed).length;
        document.getElementById('todayCompleted').textContent = todayCompleted;

        // Week's completed tasks
        const weekCompleted = this.getWeekCompleted();
        document.getElementById('weekCompleted').textContent = weekCompleted;

        // Streak
        const streak = this.calculateStreak();
        document.getElementById('streak').textContent = streak;
    }

    updateProgress() {
        const today = this.getTodayKey();
        const todayTasks = this.tasks[today] || [];
        
        if (todayTasks.length === 0) {
            this.setProgress(0);
            return;
        }

        const completed = todayTasks.filter(t => t.completed).length;
        const percentage = Math.round((completed / todayTasks.length) * 100);
        this.setProgress(percentage);
    }

    setProgress(percentage) {
        const circle = document.querySelector('.progress-ring-fill');
        const text = document.querySelector('.progress-percentage');
        const circumference = 2 * Math.PI * 28;
        const offset = circumference - (percentage / 100 * circumference);
        
        circle.style.strokeDashoffset = offset;
        text.textContent = `${percentage}%`;
    }

    getWeekCompleted() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let count = 0;

        Object.keys(this.tasks).forEach(date => {
            const taskDate = new Date(date);
            if (taskDate >= weekAgo && taskDate <= now) {
                count += this.tasks[date].filter(t => t.completed).length;
            }
        });

        return count;
    }

    calculateStreak() {
        const dates = Object.keys(this.tasks)
            .filter(date => this.tasks[date].some(t => t.completed))
            .sort()
            .reverse();

        if (dates.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const date of dates) {
            const taskDate = new Date(date);
            taskDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

            if (diffDays === streak) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    showHistory() {
        const modal = document.getElementById('historyModal');
        const content = document.getElementById('historyContent');
        
        const sortedDates = Object.keys(this.tasks).sort().reverse();
        
        if (sortedDates.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">История пуста</p>';
        } else {
            content.innerHTML = '';
            sortedDates.forEach(date => {
                const tasks = this.tasks[date];
                const completedTasks = tasks.filter(t => t.completed);
                
                if (completedTasks.length === 0) return;
                
                const dayDiv = document.createElement('div');
                dayDiv.className = 'history-day';
                
                const dateDiv = document.createElement('div');
                dateDiv.className = 'history-date';
                dateDiv.textContent = this.formatDate(date);
                dayDiv.appendChild(dateDiv);
                
                const tasksDiv = document.createElement('div');
                tasksDiv.className = 'history-tasks';
                
                completedTasks.forEach(task => {
                    const taskDiv = document.createElement('div');
                    taskDiv.className = 'history-task';
                    
                    const categorySpan = document.createElement('span');
                    categorySpan.className = 'history-task-category';
                    categorySpan.textContent = this.getCategoryName(task.category);
                    
                    const textSpan = document.createElement('span');
                    textSpan.textContent = task.text;
                    
                    taskDiv.appendChild(categorySpan);
                    taskDiv.appendChild(textSpan);
                    tasksDiv.appendChild(taskDiv);
                });
                
                dayDiv.appendChild(tasksDiv);
                content.appendChild(dayDiv);
            });
        }
        
        modal.classList.add('active');
    }

    closeHistory() {
        document.getElementById('historyModal').classList.remove('active');
    }

    async syncData() {
        const syncBtn = document.getElementById('syncBtn');
        syncBtn.classList.add('syncing');
        
        // Simulate sync process
        setTimeout(() => {
            syncBtn.classList.remove('syncing');
            this.showNotification('Данные синхронизированы');
        }, 2000);

        // In a real implementation, you would sync with a backend here
        // For GitHub Pages, you can use GitHub API or a service like Firebase
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success-color);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            animation: slideInUp 0.3s ease-out;
            z-index: 1001;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getTodayKey() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateStr === this.getTodayKey()) {
            return 'Сегодня';
        } else if (dateStr === `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`) {
            return 'Вчера';
        } else {
            return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
        }
    }

    getCategoryName(category) {
        const names = {
            work: 'Работа',
            personal: 'Личное',
            health: 'Здоровье',
            learning: 'Обучение'
        };
        return names[category] || category;
    }

    saveTasks() {
        localStorage.setItem('taskTrackerData', JSON.stringify(this.tasks));
        // Also save to a unique key based on device for sync purposes
        const deviceId = this.getDeviceId();
        localStorage.setItem(`taskTrackerData_${deviceId}`, JSON.stringify({
            tasks: this.tasks,
            lastSync: new Date().toISOString()
        }));
    }

    loadTasks() {
        try {
            const data = localStorage.getItem('taskTrackerData');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading tasks:', error);
            return {};
        }
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    checkStreak() {
        const lastVisit = localStorage.getItem('lastVisit');
        const today = this.getTodayKey();
        
        if (lastVisit !== today) {
            localStorage.setItem('lastVisit', today);
            // Could trigger a welcome back message here
        }
    }
}

// Initialize the app when DOM is ready
let taskTracker;
document.addEventListener('DOMContentLoaded', () => {
    taskTracker = new TaskTracker();
    
    // Update time every minute
    setInterval(() => {
        taskTracker.updateDate();
    }, 60000);
});

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
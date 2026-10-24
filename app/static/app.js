const tasksList = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const tasksCountLabel = document.getElementById('tasks-count-label');
const searchInput = document.getElementById('search-input');
const prioritySelect = document.getElementById('priority-select');
const categorySelect = document.getElementById('category-select');
const statusFilters = document.getElementById('status-filters');
const dbStatusPill = document.getElementById('db-status-pill');
const dbStatusText = document.getElementById('db-status-text');

const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');
const statRate = document.getElementById('stat-rate');

const taskModal = document.getElementById('task-modal');
const modalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form');
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-description');
const taskCategoryInput = document.getElementById('task-category');
const taskPrioritySelect = document.getElementById('task-priority');
const openModalBtn = document.getElementById('open-create-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const emptyCreateBtn = document.getElementById('empty-create-btn');
const toast = document.getElementById('toast');

let currentStatusFilter = 'all';
let searchDebounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  checkDbHealth();
  fetchStats();
  fetchTasks();
  setupEventListeners();
});

function setupEventListeners() {
  openModalBtn.addEventListener('click', () => openTaskModal());
  emptyCreateBtn.addEventListener('click', () => openTaskModal());
  closeModalBtn.addEventListener('click', closeTaskModal);
  cancelModalBtn.addEventListener('click', closeTaskModal);
  
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
  });

  taskForm.addEventListener('submit', handleFormSubmit);

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(fetchTasks, 300);
  });

  prioritySelect.addEventListener('change', fetchTasks);
  categorySelect.addEventListener('change', fetchTasks);

  statusFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('seg-btn')) {
      document.querySelectorAll('.seg-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentStatusFilter = e.target.dataset.filter;
      fetchTasks();
    }
  });
}

function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

async function checkDbHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.database === 'postgresql') {
      dbStatusPill.className = 'status-pill status-postgres';
      dbStatusText.textContent = 'PostgreSQL Active';
    } else {
      dbStatusPill.className = 'status-pill status-sqlite';
      dbStatusText.textContent = 'SQLite Dev Mode';
    }
  } catch (err) {
    dbStatusPill.className = 'status-pill status-sqlite';
    dbStatusText.textContent = 'DB Offline';
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/tasks/stats/summary');
    if (!res.ok) return;
    const stats = await res.json();
    statTotal.textContent = stats.total_tasks;
    statCompleted.textContent = stats.completed_tasks;
    statPending.textContent = stats.pending_tasks;
    statRate.textContent = `${stats.completion_rate_percentage}%`;
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

async function fetchTasks() {
  const params = new URLSearchParams();
  
  if (currentStatusFilter === 'completed') {
    params.append('is_completed', 'true');
  } else if (currentStatusFilter === 'pending') {
    params.append('is_completed', 'false');
  }

  if (prioritySelect.value) {
    params.append('priority', prioritySelect.value);
  }

  if (categorySelect.value) {
    params.append('category', categorySelect.value);
  }

  if (searchInput.value.trim()) {
    params.append('search', searchInput.value.trim());
  }

  try {
    const res = await fetch(`/api/tasks/?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    showToast('Failed to load tasks', 'error');
  }
}

function renderTasks(tasks) {
  tasksCountLabel.textContent = `Showing ${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  
  if (tasks.length === 0) {
    tasksList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tasksList.innerHTML = tasks.map(task => {
    const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;
    const dateFormatted = new Date(task.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="task-item ${task.is_completed ? 'completed' : ''}" id="task-${task.id}">
        <div class="task-checkbox-container">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.is_completed ? 'checked' : ''} 
            onchange="toggleTask(${task.id})"
            title="Toggle completed"
          >
        </div>
        <div class="task-body">
          <div class="task-title-row">
            <span class="task-title">${escapeHtml(task.title)}</span>
            <span class="badge ${priorityClass}">${task.priority}</span>
            <span class="badge badge-category">${escapeHtml(task.category)}</span>
          </div>
          ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
          <div class="task-meta">
            <span class="task-date">Created ${dateFormatted}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon" onclick="editTask(${task.id})" title="Edit Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-delete" onclick="deleteTask(${task.id})" title="Delete Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleTask = async function(id) {
  try {
    const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle status');
    fetchTasks();
    fetchStats();
    showToast('Task updated', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to update task', 'error');
  }
};

window.deleteTask = async function(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    fetchTasks();
    fetchStats();
    showToast('Task deleted', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to delete task', 'error');
  }
};

window.editTask = async function(id) {
  try {
    const res = await fetch(`/api/tasks/${id}`);
    if (!res.ok) throw new Error('Task not found');
    const task = await res.json();
    openTaskModal(task);
  } catch (err) {
    console.error(err);
    showToast('Could not load task details', 'error');
  }
};

function openTaskModal(task = null) {
  if (task) {
    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskCategoryInput.value = task.category || 'General';
    taskPrioritySelect.value = task.priority || 'Medium';
  } else {
    modalTitle.textContent = 'Create New Task';
    taskForm.reset();
    taskIdInput.value = '';
    taskCategoryInput.value = 'General';
    taskPrioritySelect.value = 'Medium';
  }
  taskModal.style.display = 'flex';
  taskTitleInput.focus();
}

function closeTaskModal() {
  taskModal.style.display = 'none';
  taskForm.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = taskIdInput.value;
  const isEdit = Boolean(id);

  const payload = {
    title: taskTitleInput.value.trim(),
    description: taskDescInput.value.trim() || null,
    category: taskCategoryInput.value.trim() || 'General',
    priority: taskPrioritySelect.value,
  };

  const url = isEdit ? `/api/tasks/${id}` : '/api/tasks/';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Save failed');
    }

    closeTaskModal();
    fetchTasks();
    fetchStats();
    showToast(isEdit ? 'Task updated!' : 'Task created!', 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

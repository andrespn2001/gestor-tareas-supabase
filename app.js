// ==========================================
// SIMULACIÓN DE SUPABASE (Para que funcione en GitHub)
// ==========================================
let mockDB = JSON.parse(localStorage.getItem('supabase-mock-pro')) || [];

const mockSupabase = {
    from: () => ({
        select: async () => { await new Promise(r => setTimeout(r, 500)); return { data: [...mockDB], error: null }; },
        insert: async (items) => {
            await new Promise(r => setTimeout(r, 500));
            const newItem = { id: Date.now(), ...items[0] };
            mockDB.unshift(newItem);
            localStorage.setItem('supabase-mock-pro', JSON.stringify(mockDB));
            return { data: [newItem], error: null };
        },
        update: (changes) => ({
            eq: async (col, val) => {
                await new Promise(r => setTimeout(r, 300));
                mockDB = mockDB.map(t => t.id === val ? { ...t, ...changes } : t);
                localStorage.setItem('supabase-mock-pro', JSON.stringify(mockDB));
                return { data: mockDB.filter(t => t.id === val), error: null };
            }
        }),
        delete: () => ({
            eq: async (col, val) => {
                await new Promise(r => setTimeout(r, 300));
                mockDB = mockDB.filter(t => t[col] !== val);
                localStorage.setItem('supabase-mock-pro', JSON.stringify(mockDB));
                return { error: null };
            }
        })
    })
};

// ==========================================
// LÓGICA DE LA APP
// ==========================================
let tasks = [];
let currentFilter = 'all';
let searchTerm = '';

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTasks();
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = 
            currentFilter === 'all' || 
            (currentFilter === 'completed' && task.completed) ||
            (currentFilter === 'pending' && !task.completed);
        const matchesSearch = task.text.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');
        
        li.innerHTML = `
            <div class="task-info" onclick="toggleTask(${task.id})">
                <span class="task-text">${task.text}</span>
                <span class="badge ${task.priority}">${task.priority.toUpperCase()}</span>
            </div>
            <button class="delete-btn" onclick="deleteTask(${task.id})">🗑</button>
        `;
        taskList.appendChild(li);
    });
}

async function cargarTareas() {
    const { data } = await mockSupabase.from('tasks').select();
    tasks = data;
    renderTasks();
}

async function addTask() {
    const input = document.getElementById('taskInput');
    const priority = document.getElementById('priorityInput').value;
    const text = input.value.trim();
    if (!text) return;

    const { data } = await mockSupabase.from('tasks').insert([{ text, completed: false, priority }]);
    tasks.unshift(data[0]);
    input.value = '';
    renderTasks();
}

async function toggleTask(id) {
    const tarea = tasks.find(t => t.id === id);
    const { data } = await mockSupabase.from('tasks').update({ completed: !tarea.completed }).eq('id', id);
    const index = tasks.findIndex(t => t.id === id);
    tasks[index] = data[0];
    renderTasks();
}

async function deleteTask(id) {
    await mockSupabase.from('tasks').delete().eq('id', id);
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
}

async function limpiarCompletadas() {
    await mockSupabase.from('tasks').delete().eq('completed', true);
    tasks = tasks.filter(t => !t.completed);
    renderTasks();
}

// Iniciar
cargarTareas();

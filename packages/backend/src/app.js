const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const serializeTask = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  dueDate: task.due_date,
  completed: Boolean(task.completed),
  createdAt: task.created_at,
  updatedAt: task.updated_at,
});

const validateTaskInput = ({ title, description, dueDate }, { requireTitle = true } = {}) => {
  const errors = [];

  if (requireTitle) {
    if (typeof title !== 'string' || title.trim() === '') {
      errors.push('Task title is required');
    }
  } else if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    errors.push('Task title must not be empty');
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push('Task description must be a string');
  }

  if (
    dueDate !== undefined &&
    dueDate !== null &&
    dueDate !== '' &&
    Number.isNaN(Date.parse(dueDate))
  ) {
    errors.push('Task due date must be a valid date');
  }

  return errors;
};

const normalizeDueDate = (dueDate) => {
  if (!dueDate) {
    return null;
  }

  return new Date(dueDate).toISOString();
};

const nowIsoString = () => new Date().toISOString();

const createTaskStatement = db.prepare(`
  INSERT INTO tasks (title, description, due_date, completed, created_at, updated_at)
  VALUES (@title, @description, @dueDate, @completed, @createdAt, @updatedAt)
`);

const selectTaskByIdStatement = db.prepare('SELECT * FROM tasks WHERE id = ?');
const deleteTaskStatement = db.prepare('DELETE FROM tasks WHERE id = ?');

const seedTasks = [
  {
    title: 'Review TODO requirements',
    description: 'Read the functional and UI guidelines before implementing features.',
    dueDate: null,
    completed: 0,
  },
  {
    title: 'Build task creation flow',
    description: 'Support title, description, and due date inputs.',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    completed: 0,
  },
  {
    title: 'Clean up starter item UI',
    description: 'Replace generic item copy with task-oriented language.',
    dueDate: null,
    completed: 1,
  },
];

seedTasks.forEach((task) => {
  const timestamp = nowIsoString();

  createTaskStatement.run({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    completed: task.completed,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
});

console.log('In-memory task database initialized with sample data');

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/tasks', (req, res) => {
  try {
    const { status = 'all' } = req.query;

    if (!['all', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be one of all, active, or completed' });
    }

    const tasks = db.prepare(`
      SELECT *
      FROM tasks
      WHERE (@status = 'all')
         OR (@status = 'active' AND completed = 0)
         OR (@status = 'completed' AND completed = 1)
      ORDER BY completed ASC,
               CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC,
               due_date ASC,
               datetime(created_at) DESC
    `).all({ status });

    res.json(tasks.map(serializeTask));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, description = '', dueDate = null } = req.body;
    const validationErrors = validateTaskInput({ title, description, dueDate });

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    const timestamp = nowIsoString();
    const result = createTaskStatement.run({
      title: title.trim(),
      description: description.trim(),
      dueDate: normalizeDueDate(dueDate),
      completed: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const newTask = selectTaskByIdStatement.get(result.lastInsertRowid);
    res.status(201).json(serializeTask(newTask));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = selectTaskByIdStatement.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, dueDate, completed } = req.body;
    const validationErrors = validateTaskInput(
      { title, description, dueDate },
      { requireTitle: false }
    );

    if (completed !== undefined && typeof completed !== 'boolean') {
      validationErrors.push('Task completed flag must be a boolean');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    const updatedTask = {
      title: title !== undefined ? title.trim() : existingTask.title,
      description: description !== undefined ? description.trim() : existingTask.description,
      dueDate:
        dueDate !== undefined ? normalizeDueDate(dueDate) : existingTask.due_date,
      completed: completed !== undefined ? Number(completed) : existingTask.completed,
      updatedAt: nowIsoString(),
      id: existingTask.id,
    };

    db.prepare(`
      UPDATE tasks
      SET title = @title,
          description = @description,
          due_date = @dueDate,
          completed = @completed,
          updated_at = @updatedAt
      WHERE id = @id
    `).run(updatedTask);

    const persistedTask = selectTaskByIdStatement.get(existingTask.id);
    res.json(serializeTask(persistedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = selectTaskByIdStatement.get(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = deleteTaskStatement.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Task deleted successfully', id: parseInt(id, 10) });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = { app, db };
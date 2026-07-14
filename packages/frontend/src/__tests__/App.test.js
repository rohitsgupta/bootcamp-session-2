import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let tasks = [];

const sortTasksLikeBackend = (taskList) =>
  [...taskList].sort((leftTask, rightTask) => {
    if (leftTask.completed !== rightTask.completed) {
      return Number(leftTask.completed) - Number(rightTask.completed);
    }

    const leftHasDueDate = Boolean(leftTask.dueDate);
    const rightHasDueDate = Boolean(rightTask.dueDate);

    if (leftHasDueDate !== rightHasDueDate) {
      return leftHasDueDate ? -1 : 1;
    }

    if (leftTask.dueDate && rightTask.dueDate && leftTask.dueDate !== rightTask.dueDate) {
      return new Date(leftTask.dueDate) - new Date(rightTask.dueDate);
    }

    return new Date(rightTask.createdAt) - new Date(leftTask.createdAt);
  });

const validateTaskPayload = (payload, { requireTitle = true } = {}) => {
  if (requireTitle) {
    if (typeof payload.title !== 'string' || payload.title.trim() === '') {
      return 'Task title is required';
    }
  } else if (payload.title !== undefined && (typeof payload.title !== 'string' || payload.title.trim() === '')) {
    return 'Task title must not be empty';
  }

  if (payload.description !== undefined && typeof payload.description !== 'string') {
    return 'Task description must be a string';
  }

  if (
    payload.dueDate !== undefined &&
    payload.dueDate !== null &&
    payload.dueDate !== '' &&
    Number.isNaN(Date.parse(payload.dueDate))
  ) {
    return 'Task due date must be a valid date';
  }

  return null;
};

const normalizeDueDate = (dueDate) => {
  if (!dueDate) {
    return null;
  }

  return new Date(dueDate).toISOString();
};

const resetTasks = () => {
  tasks = [
    {
      id: 1,
      title: 'Write deployment notes',
      description: 'Summarize the release steps for the next sprint demo.',
      dueDate: '2026-07-20T00:00:00.000Z',
      completed: false,
      createdAt: '2026-07-14T09:00:00.000Z',
      updatedAt: '2026-07-14T09:00:00.000Z',
    },
    {
      id: 2,
      title: 'Archive old backlog items',
      description: '',
      dueDate: null,
      completed: true,
      createdAt: '2026-07-13T09:00:00.000Z',
      updatedAt: '2026-07-13T09:00:00.000Z',
    },
  ];
};

const readJsonBody = (body) => (typeof body === 'string' ? JSON.parse(body) : body);

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    const status = req.url.searchParams.get('status') || 'all';

    if (!['all', 'active', 'completed'].includes(status)) {
      return res(ctx.status(400), ctx.json({ error: 'Status must be one of all, active, or completed' }));
    }

    const filteredTasks = tasks.filter((task) => {
      if (status === 'active') {
        return !task.completed;
      }

      if (status === 'completed') {
        return task.completed;
      }

      return true;
    });

    return res(ctx.status(200), ctx.json(sortTasksLikeBackend(filteredTasks)));
  }),
  rest.post('/api/tasks', (req, res, ctx) => {
    const body = readJsonBody(req.body);
    const validationError = validateTaskPayload(body);

    if (validationError) {
      return res(ctx.status(400), ctx.json({ error: validationError }));
    }

    const newTask = {
      id: tasks.length + 1,
      title: body.title.trim(),
      description: (body.description || '').trim(),
      dueDate: normalizeDueDate(body.dueDate),
      completed: false,
      createdAt: '2026-07-14T10:00:00.000Z',
      updatedAt: '2026-07-14T10:00:00.000Z',
    };

    tasks = [...tasks, newTask];

    return res(ctx.status(201), ctx.json(newTask));
  }),
  rest.patch('/api/tasks/:taskId', (req, res, ctx) => {
    const body = readJsonBody(req.body);
    const taskId = Number(req.params.taskId);
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    const validationError = validateTaskPayload(body, { requireTitle: false });

    if (validationError) {
      return res(ctx.status(400), ctx.json({ error: validationError }));
    }

    if (body.completed !== undefined && typeof body.completed !== 'boolean') {
      return res(ctx.status(400), ctx.json({ error: 'Task completed flag must be a boolean' }));
    }

    const updatedTask = {
      ...task,
      ...body,
      title: body.title !== undefined ? body.title.trim() : task.title,
      description: body.description !== undefined ? body.description.trim() : task.description,
      dueDate: body.dueDate === undefined ? task.dueDate : normalizeDueDate(body.dueDate),
      updatedAt: '2026-07-14T11:00:00.000Z',
    };

    tasks = tasks.map((currentTask) => (currentTask.id === taskId ? updatedTask : currentTask));

    return res(ctx.status(200), ctx.json(updatedTask));
  }),
  rest.delete('/api/tasks/:taskId', (req, res, ctx) => {
    const taskId = Number(req.params.taskId);
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!Number.isInteger(taskId)) {
      return res(ctx.status(400), ctx.json({ error: 'Valid task ID is required' }));
    }

    if (!task) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    tasks = tasks.filter((task) => task.id !== taskId);

    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id: taskId }));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  resetTasks();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('App Component', () => {
  beforeEach(() => {
    resetTasks();
  });

  test('renders the task planner header and loads tasks', async () => {
    render(<App />);

    expect(screen.getByText('Task Planner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
      expect(screen.getByText('Archive old backlog items')).toBeInTheDocument();
    });
  });

  test('shows validation when the title is missing', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(screen.getAllByText('Task title is required.')[0]).toBeInTheDocument();
  });

  test('creates a new task', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Prepare sprint review' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Collect outcomes and open questions.' },
    });
    fireEvent.change(screen.getByLabelText('Due date'), {
      target: { value: '2026-07-25' },
    });
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => {
      expect(screen.getByText('Prepare sprint review')).toBeInTheDocument();
    });
  });

  test('filters completed tasks', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Completed' }));

    await waitFor(() => {
      expect(screen.getByText('Archive old backlog items')).toBeInTheDocument();
      expect(screen.queryByText('Write deployment notes')).not.toBeInTheDocument();
    });
  });

  test('sorts active tasks ahead of completed tasks and by due date', async () => {
    tasks = [
      {
        id: 1,
        title: 'Completed item',
        description: '',
        dueDate: null,
        completed: true,
        createdAt: '2026-07-10T09:00:00.000Z',
        updatedAt: '2026-07-10T09:00:00.000Z',
      },
      {
        id: 2,
        title: 'No due date active',
        description: '',
        dueDate: null,
        completed: false,
        createdAt: '2026-07-12T09:00:00.000Z',
        updatedAt: '2026-07-12T09:00:00.000Z',
      },
      {
        id: 3,
        title: 'Later due date',
        description: '',
        dueDate: '2026-07-18T00:00:00.000Z',
        completed: false,
        createdAt: '2026-07-11T09:00:00.000Z',
        updatedAt: '2026-07-11T09:00:00.000Z',
      },
      {
        id: 4,
        title: 'Earlier due date',
        description: '',
        dueDate: '2026-07-15T00:00:00.000Z',
        completed: false,
        createdAt: '2026-07-09T09:00:00.000Z',
        updatedAt: '2026-07-09T09:00:00.000Z',
      },
    ];

    render(<App />);

    await waitFor(() => {
      const taskListHeading = screen.getByRole('heading', { name: 'Task list' });
      const taskPanel = taskListHeading.closest('.MuiCardContent-root');
      const taskTitles = within(taskPanel).getAllByRole('heading', { level: 6 }).map((node) => node.textContent);

      expect(taskTitles).toEqual([
        'Earlier due date',
        'Later due date',
        'No due date active',
        'Completed item',
      ]);
    });
  });

  test('shows an overdue label for overdue active tasks', async () => {
    tasks = [
      {
        id: 1,
        title: 'Overdue task',
        description: '',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        createdAt: '2026-07-14T09:00:00.000Z',
        updatedAt: '2026-07-14T09:00:00.000Z',
      },
    ];

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  test('edits an existing task', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Edit Write deployment notes'));

    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    const titleField = within(dialog).getByLabelText('Task title');

    fireEvent.change(titleField, {
      target: { value: 'Write release notes' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Write release notes')).toBeInTheDocument();
    });
  });

  test('shows an error when editing fails', async () => {
    const user = userEvent.setup();

    server.use(
      rest.patch('/api/tasks/:taskId', (req, res, ctx) =>
        res(ctx.status(400), ctx.json({ error: 'Task title must not be empty' }))
      )
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Edit Write deployment notes'));
    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });

    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update task: Task title must not be empty')).toBeInTheDocument();
      expect(within(dialog).getByDisplayValue('Write deployment notes')).toBeInTheDocument();
    });
  });

  test('deletes a task after confirmation', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Delete Write deployment notes'));
    await user.click(await screen.findByRole('button', { name: 'Delete task' }));

    await waitFor(() => {
      expect(screen.queryByText('Write deployment notes')).not.toBeInTheDocument();
    });
  });

  test('shows an error when deleting fails', async () => {
    const user = userEvent.setup();

    server.use(
      rest.delete('/api/tasks/:taskId', (req, res, ctx) =>
        res(ctx.status(404), ctx.json({ error: 'Task not found' }))
      )
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Delete Write deployment notes'));
    const dialog = await screen.findByRole('dialog', { name: 'Delete task?' });

    await user.click(within(dialog).getByRole('button', { name: 'Delete task' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete task: Task not found')).toBeInTheDocument();
      expect(within(dialog).getByText(/Write deployment notes/)).toBeInTheDocument();
    });
  });

  test('shows a validation error for a missing title before submitting', async () => {
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Write deployment notes')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Due date'), {
      target: { value: '2026-07-25' },
    });
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(screen.getAllByText('Task title is required.')[0]).toBeInTheDocument();
  });

  test('shows an error state when loading fails', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(500), ctx.json({ error: 'Server unavailable' })))
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch tasks: Server unavailable')).toBeInTheDocument();
    });
  });
});
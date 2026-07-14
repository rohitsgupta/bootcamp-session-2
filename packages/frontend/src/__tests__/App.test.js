import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let tasks = [];

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

    return res(ctx.status(200), ctx.json(filteredTasks));
  }),
  rest.post('/api/tasks', (req, res, ctx) => {
    const body = readJsonBody(req.body);

    if (!body.title || body.title.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }

    const newTask = {
      id: tasks.length + 1,
      title: body.title,
      description: body.description || '',
      dueDate: body.dueDate,
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

    const updatedTask = {
      ...task,
      ...body,
      dueDate: body.dueDate === undefined ? task.dueDate : body.dueDate,
      updatedAt: '2026-07-14T11:00:00.000Z',
    };

    tasks = tasks.map((currentTask) => (currentTask.id === taskId ? updatedTask : currentTask));

    return res(ctx.status(200), ctx.json(updatedTask));
  }),
  rest.delete('/api/tasks/:taskId', (req, res, ctx) => {
    const taskId = Number(req.params.taskId);
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
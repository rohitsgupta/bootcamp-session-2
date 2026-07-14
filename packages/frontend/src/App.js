import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './App.css';

const taskTheme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
  palette: {
    primary: {
      main: '#1F4E79',
    },
    secondary: {
      main: '#2A7F62',
    },
    background: {
      default: '#F7F9FC',
      paper: '#FFFFFF',
    },
    error: {
      main: '#C0392B',
    },
    text: {
      primary: '#1F2933',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h3: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

const emptyTaskForm = {
  title: '',
  description: '',
  dueDate: '',
};

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = 'Request failed';

    try {
      const payload = await response.json();
      errorMessage = payload.error || errorMessage;
    } catch (error) {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const fetchTasksRequest = (status) => requestJson(`/api/tasks?status=${status}`);

const createTaskRequest = (task) =>
  requestJson('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

const updateTaskRequest = (taskId, task) =>
  requestJson(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

const deleteTaskRequest = (taskId) =>
  requestJson(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });

const formatDueDate = (dueDate) => {
  if (!dueDate) {
    return 'No due date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dueDate));
};

const isOverdue = (task) => {
  if (task.completed || !task.dueDate) {
    return false;
  }

  return new Date(task.dueDate) < new Date();
};

const isValidDateValue = (value) => !Number.isNaN(Date.parse(value));

const buildTaskPayload = (formValues) => ({
  title: formValues.title.trim(),
  description: formValues.description.trim(),
  dueDate: formValues.dueDate ? new Date(formValues.dueDate).toISOString() : null,
});

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [formError, setFormError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState(emptyTaskForm);
  const [editError, setEditError] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        setLoading(true);
        const result = await fetchTasksRequest(filter);

        if (isMounted) {
          setTasks(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to fetch tasks: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [filter]);

  const refreshTasks = async (nextFilter = filter) => {
    const result = await fetchTasksRequest(nextFilter);
    setTasks(result);
    setError(null);
  };

  const handleTaskFormChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    if (taskForm.dueDate && !isValidDateValue(taskForm.dueDate)) {
      setFormError('Task due date must be a valid date.');
      return;
    }

    try {
      await createTaskRequest(buildTaskPayload(taskForm));
      await refreshTasks();
      setTaskForm(emptyTaskForm);
      setFormError('');
      setFeedback('Task created successfully.');
    } catch (err) {
      setError(`Failed to create task: ${err.message}`);
    }
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
    setEditError('');
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingTask) {
      return;
    }

    if (!editForm.title.trim()) {
      setEditError('Task title is required.');
      return;
    }

    if (editForm.dueDate && !isValidDateValue(editForm.dueDate)) {
      setEditError('Task due date must be a valid date.');
      return;
    }

    try {
      await updateTaskRequest(editingTask.id, buildTaskPayload(editForm));
      await refreshTasks();
      setEditingTask(null);
      setEditForm(emptyTaskForm);
      setEditError('');
      setFeedback('Task updated successfully.');
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
    }
  };

  const handleToggleCompletion = async (task) => {
    try {
      await updateTaskRequest(task.id, { completed: !task.completed });
      await refreshTasks();
      setError(null);
      setFeedback(task.completed ? 'Task marked as active.' : 'Task completed.');
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteCandidate) {
      return;
    }

    try {
      await deleteTaskRequest(deleteCandidate.id);
      await refreshTasks();
      setDeleteCandidate(null);
      setError(null);
      setFeedback('Task deleted successfully.');
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  return (
    <ThemeProvider theme={taskTheme}>
      <CssBaseline />
      <Box className="app-shell">
        <Container maxWidth="md" className="app-container">
          <Stack spacing={3}>
            <Box className="hero-panel">
              <Typography variant="h3" component="h1" gutterBottom>
                Task Planner
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Track work, due dates, and progress in one focused task board.
              </Typography>
            </Box>

            <Card elevation={0} className="task-panel">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5" component="h2">
                    Create a task
                  </Typography>
                  <Box component="form" onSubmit={handleCreateTask}>
                    <Stack spacing={2}>
                      <TextField
                        label="Task title"
                        name="title"
                        value={taskForm.title}
                        onChange={handleTaskFormChange}
                        error={Boolean(formError)}
                        helperText={formError || 'Required'}
                        fullWidth
                      />
                      <TextField
                        label="Description"
                        name="description"
                        value={taskForm.description}
                        onChange={handleTaskFormChange}
                        multiline
                        minRows={3}
                        fullWidth
                      />
                      <TextField
                        label="Due date"
                        name="dueDate"
                        type="date"
                        value={taskForm.dueDate}
                        onChange={handleTaskFormChange}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <Box>
                        <Button type="submit" variant="contained" size="large">
                          Create task
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} className="task-panel">
              <CardContent>
                <Stack spacing={2.5}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h5" component="h2">
                        Task list
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Incomplete tasks appear first, with earlier due dates at the top.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {filterOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={filter === option.value ? 'contained' : 'outlined'}
                          color={filter === option.value ? 'primary' : 'inherit'}
                          onClick={() => setFilter(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>

                  {loading && (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CircularProgress size={24} />
                      <Typography>Loading tasks...</Typography>
                    </Stack>
                  )}

                  {error && <Alert severity="error">{error}</Alert>}

                  {!loading && !error && tasks.length === 0 && (
                    <Alert severity="info">No tasks found for this view. Create one to get started.</Alert>
                  )}

                  {!loading && !error && tasks.length > 0 && (
                    <Stack spacing={2}>
                      {tasks.map((task) => (
                        <Card
                          key={task.id}
                          variant="outlined"
                          className={task.completed ? 'task-card task-card-completed' : 'task-card'}
                        >
                          <CardContent>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                              <Checkbox
                                checked={task.completed}
                                onChange={() => handleToggleCompletion(task)}
                                inputProps={{
                                  'aria-label': `${task.completed ? 'Mark' : 'Complete'} ${task.title}`,
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Stack
                                  direction={{ xs: 'column', sm: 'row' }}
                                  justifyContent="space-between"
                                  spacing={1.5}
                                >
                                  <Box>
                                    <Typography
                                      variant="h6"
                                      className={task.completed ? 'task-title-completed' : 'task-title'}
                                    >
                                      {task.title}
                                    </Typography>
                                    {task.description && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                        {task.description}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                      label={task.completed ? 'Completed' : 'Active'}
                                      color={task.completed ? 'default' : 'secondary'}
                                      variant={task.completed ? 'outlined' : 'filled'}
                                    />
                                    {isOverdue(task) && <Chip label="Overdue" color="error" />}
                                  </Stack>
                                </Stack>

                                <Stack
                                  direction={{ xs: 'column', sm: 'row' }}
                                  justifyContent="space-between"
                                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                                  spacing={1.5}
                                  sx={{ mt: 2 }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    Due: {formatDueDate(task.dueDate)}
                                  </Typography>
                                  <Stack direction="row" spacing={1}>
                                    <IconButton
                                      aria-label={`Edit ${task.title}`}
                                      color="primary"
                                      onClick={() => openEditDialog(task)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    <IconButton
                                      aria-label={`Delete ${task.title}`}
                                      color="error"
                                      onClick={() => setDeleteCandidate(task)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Stack>
                                </Stack>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Container>

        <Dialog open={Boolean(editingTask)} onClose={() => setEditingTask(null)} fullWidth maxWidth="sm">
          <DialogTitle>Edit task</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Task title"
                name="title"
                value={editForm.title}
                onChange={handleEditFormChange}
                error={Boolean(editError)}
                helperText={editError || 'Required'}
                fullWidth
              />
              <TextField
                label="Description"
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                multiline
                minRows={3}
                fullWidth
              />
              <TextField
                label="Due date"
                name="dueDate"
                type="date"
                value={editForm.dueDate}
                onChange={handleEditFormChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Save changes
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(deleteCandidate)}
          onClose={() => setDeleteCandidate(null)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Delete task?</DialogTitle>
          <DialogContent>
            <Typography>
              {deleteCandidate
                ? `Remove "${deleteCandidate.title}" from your task list? This action cannot be undone.`
                : ''}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteCandidate(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDeleteTask}>
              Delete task
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(feedback)}
          autoHideDuration={3000}
          onClose={() => setFeedback('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setFeedback('')} variant="filled">
            {feedback}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
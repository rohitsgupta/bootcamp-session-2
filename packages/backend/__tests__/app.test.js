const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createTask = async (overrides = {}) => {
  const response = await request(app)
    .post('/api/tasks')
    .send({
      title: 'Temp Task',
      description: 'Task created by test helper',
      dueDate: '2026-07-20T00:00:00.000Z',
      ...overrides,
    })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const task = response.body[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('dueDate');
      expect(task).toHaveProperty('completed');
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
    });

    it('should filter active tasks', async () => {
      const response = await request(app).get('/api/tasks?status=active');

      expect(response.status).toBe(200);
      expect(response.body.every((task) => task.completed === false)).toBe(true);
    });

    it('should return 400 for an unsupported status filter', async () => {
      const response = await request(app).get('/api/tasks?status=archived');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Status must be one of all, active, or completed');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'Test Task',
        description: 'A task created by a POST test',
        dueDate: '2026-07-21T12:00:00.000Z',
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBe(newTask.description);
      expect(response.body.dueDate).toBe(newTask.dueDate);
      expect(response.body.completed).toBe(false);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task title is required');
    });

    it('should return 400 if title is empty', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task title is required');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      const task = await createTask({ title: 'Task To Update' });

      const updateResponse = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .send({
          title: 'Updated Task',
          description: 'Updated description',
          completed: true,
        })
        .set('Accept', 'application/json');

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.title).toBe('Updated Task');
      expect(updateResponse.body.description).toBe('Updated description');
      expect(updateResponse.body.completed).toBe(true);
    });

    it('should return 400 for invalid update payload', async () => {
      const task = await createTask({ title: 'Task With Bad Update' });

      const updateResponse = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .send({ completed: 'yes' })
        .set('Accept', 'application/json');

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body).toHaveProperty('error', 'Task completed flag must be a boolean');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete an existing task', async () => {
      const task = await createTask({ title: 'Task To Be Deleted' });

      const deleteResponse = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Task deleted successfully', id: task.id });

      const deleteAgain = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app).delete('/api/tasks/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/tasks/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid task ID is required');
    });
  });
});
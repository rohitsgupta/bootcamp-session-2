const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('Tasks API integration', () => {
  it('creates, updates, and deletes a task through the HTTP API', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Integration test task',
        description: 'Created from the integration suite',
        dueDate: '2026-07-31T00:00:00.000Z',
      })
      .set('Accept', 'application/json');

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.title).toBe('Integration test task');
    expect(createResponse.body.completed).toBe(false);

    const taskId = createResponse.body.id;

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ completed: true, title: 'Integration test task updated' })
      .set('Accept', 'application/json');

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.completed).toBe(true);
    expect(updateResponse.body.title).toBe('Integration test task updated');

    const listResponse = await request(app).get('/api/tasks?status=completed');

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.some((task) => task.id === taskId)).toBe(true);

    const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'Task deleted successfully',
      id: taskId,
    });
  });
});
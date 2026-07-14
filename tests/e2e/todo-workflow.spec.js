const { test, expect } = require('@playwright/test');
const { TodoAppPage } = require('./page-objects/todo-app.page');

test.describe('TODO workflow', () => {
  test('creates a task, persists it after reload, and finds it in the completed view after marking it done', async ({ page }) => {
    const todoAppPage = new TodoAppPage(page);
    const uniqueTitle = `E2E task ${Date.now()}`;

    await todoAppPage.goto();
    await todoAppPage.createTask({
      title: uniqueTitle,
      description: 'Created by the Playwright workflow test.',
      dueDate: '2026-08-01',
    });

    await expect(todoAppPage.taskTitle(uniqueTitle)).toBeVisible();
    await todoAppPage.reload();
    await expect(todoAppPage.taskTitle(uniqueTitle)).toBeVisible();

    await todoAppPage.completionToggle(uniqueTitle).click();
    await todoAppPage.completedFilterButton().click();

    await expect(todoAppPage.taskTitle(uniqueTitle)).toBeVisible();
  });

  test('shows validation when the user tries to create a task without a title', async ({ page }) => {
    const todoAppPage = new TodoAppPage(page);

    await todoAppPage.goto();
    await todoAppPage.createTaskWithoutTitle();

    await expect(todoAppPage.validationMessage('Task title is required.')).toBeVisible();
  });
});
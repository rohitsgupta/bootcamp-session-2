class TodoAppPage {
  constructor(page) {
    this.page = page;
    this.titleInput = page.getByLabel('Task title');
    this.descriptionInput = page.getByLabel('Description');
    this.dueDateInput = page.getByLabel('Due date');
    this.createTaskButton = page.getByRole('button', { name: 'Create task' });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.getByRole('heading', { name: 'Task Planner' }).waitFor();
  }

  async createTask({ title, description, dueDate }) {
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);
    await this.dueDateInput.fill(dueDate);
    await this.createTaskButton.click();
  }

  async createTaskWithoutTitle() {
    await this.createTaskButton.click();
  }

  async reload() {
    await this.page.reload();
    await this.page.getByRole('heading', { name: 'Task Planner' }).waitFor();
  }

  taskTitle(title) {
    return this.page.getByText(title, { exact: true });
  }

  successMessage(text) {
    return this.page.getByText(text, { exact: true });
  }

  validationMessage(text) {
    return this.page.getByText(text, { exact: true });
  }

  completionToggle(title) {
    return this.page
      .locator('.task-card')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) })
      .getByRole('checkbox');
  }

  completedFilterButton() {
    return this.page.getByRole('button', { name: 'Completed' });
  }
}

module.exports = { TodoAppPage };
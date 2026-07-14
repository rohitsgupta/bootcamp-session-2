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

  taskTitle(title) {
    return this.page.getByText(title, { exact: true });
  }

  completionToggle(title) {
    return this.page.getByRole('checkbox', { name: `Complete ${title}` });
  }

  completedFilterButton() {
    return this.page.getByRole('button', { name: 'Completed' });
  }
}

module.exports = { TodoAppPage };
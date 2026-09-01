import { Bee } from "@ethersphere/bee-js";
import {
  CreateTaskModel,
  ExtendedTask,
  TaskState,
  UpdateStatusFunction,
} from "./models";
import {
  ErrorCode,
  McpError,
  Result,
  Task,
} from "@modelcontextprotocol/sdk/types.js";
import {
  TASK_CLEANUP_INTERVAL_MS,
  TASK_STATUS_UPDATE_INTERVAL_MS,
} from "./constants";
import { InMemoryTaskStore } from "@modelcontextprotocol/sdk/experimental/tasks/stores/in-memory.js";
import { isTerminal as isTaskTerminal } from "@modelcontextprotocol/sdk/experimental/tasks/interfaces.js";
import config from "../config";

export class TaskManager {
  private bee: Bee;
  private store: InMemoryTaskStore;
  private extendedTasks: Map<string, ExtendedTask> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private statusUpdateInterval: NodeJS.Timeout;

  constructor(bee: Bee, taskStore: InMemoryTaskStore) {
    this.bee = bee;
    this.store = taskStore;

    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldTasks();
    }, TASK_CLEANUP_INTERVAL_MS);

    this.statusUpdateInterval = setInterval(() => {
      this.updateAllSwarmTasks();
    }, TASK_STATUS_UPDATE_INTERVAL_MS);
  }

  async createTask(
    createTaskModel: CreateTaskModel,
    updateStatus: UpdateStatusFunction | null,
    result: Result | null,
    _meta?: Record<string, string | null>
  ): Promise<Task> {
    const task = await this.store.createTask(
      createTaskModel.taskOptions,
      createTaskModel.requestId,
      createTaskModel.request as unknown as Request,
      createTaskModel.sessionId
    );
    const extendedTask: ExtendedTask = {
      task,
      updateStatus,
      result,
      _meta,
    };

    this.extendedTasks.set(task.taskId, extendedTask);

    return task;
  }

  removeTask(taskId: string) {
    this.extendedTasks.delete(taskId);
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.store.getTask(taskId);
  }

  async updateTaskStatus(taskId: string, status: TaskState, message: string) {
    this.store.updateTaskStatus(taskId, status, message);
  }

  async addExtendedTaskMetadata(taskId: string, key: string, value: string) {
    const extendedTask = this.extendedTasks.get(taskId);
    if (!extendedTask) {
      return;
    }
    if (!extendedTask._meta) {
      extendedTask._meta = {
        [key]: value,
      };
    } else {
      extendedTask._meta = {
        ...extendedTask._meta,
        [key]: value,
      };
    }
  }

  async getTaskResult(taskId: string, _sessionId: string): Promise<Result> {
    while (true) {
      const task = await this.store.getTask(taskId);
      if (!task) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Task not found: ${taskId}`
        );
      }

      if (isTaskTerminal(task.status)) {
        const result = await this.store.getTaskResult(taskId);

        return result;
      }
    }
  }

  async listTasks(cursor: string | undefined): Promise<{
    tasks: Task[];
    nextCursor?: string;
  }> {
    return this.store.listTasks(cursor);
  }

  async setTaskResult(
    taskId: string,
    result: Result,
    isDeferredStoreUpdate: boolean = false
  ): Promise<void> {
    const extendedTask = this.extendedTasks.get(taskId);
    if (extendedTask) {
      extendedTask.result = result;
    }
    if (!isDeferredStoreUpdate) {
      await this.store.storeTaskResult(taskId, TaskState.COMPLETED, result);
    }
  }

  async syncStoreCompletedResult(taskId: string): Promise<void> {
    const extendedTask = this.extendedTasks.get(taskId);
    if (extendedTask?.result) {
      await this.store.storeTaskResult(
        taskId,
        TaskState.COMPLETED,
        extendedTask.result
      );
    }
  }

  private async updateAllSwarmTasks(): Promise<void> {
    const activeTasks = Array.from(this.extendedTasks.values()).filter(
      (extendedTask) =>
        typeof extendedTask.updateStatus === "function" &&
        !isTaskTerminal(extendedTask.task.status)
    );

    // Update all active Swarm tasks in parallel
    await Promise.allSettled(
      activeTasks.map((task) => task.updateStatus!(task, this.bee, this))
    );
  }

  private cleanupOldTasks(): void {
    const now = Date.now();
    const tasksToDelete: string[] = [];

    for (const [taskId, extendedTask] of this.extendedTasks.entries()) {
      // Only clean up terminal tasks
      if (isTaskTerminal(extendedTask.task.status)) {
        const lastUpdated = new Date(extendedTask.task.lastUpdatedAt).getTime();
        if (now - lastUpdated > config.bee.taskTtlMs) {
          tasksToDelete.push(taskId);
        }
      }
    }

    // Delete old tasks
    for (const taskId of tasksToDelete) {
      this.extendedTasks.delete(taskId);
    }
  }

  destroy(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

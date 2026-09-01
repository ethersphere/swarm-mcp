import { Bee } from "@ethersphere/bee-js";
import { RequestId, Result, Task } from "@modelcontextprotocol/sdk/types.js";
import { CreateTaskOptions } from "@modelcontextprotocol/sdk/experimental/tasks/interfaces.js";
import { TaskManager } from "./task-manager";

export type UpdateStatusFunction = (
  task: ExtendedTask,
  bee: Bee,
  taskManager: TaskManager
) => void;

export interface ExtendedTask {
  task: Task;
  result: Result | null;
  updateStatus: UpdateStatusFunction | null;
  _meta?: {
    [x: string]: string | null;
  };
}

export interface CreateTaskModel {
  taskOptions: CreateTaskOptions;
  requestId: RequestId;
  request: unknown;
  sessionId: string | undefined;
}

export enum TaskState {
  WORKING = "working",
  INPUT_REQUIRED = "input_required",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

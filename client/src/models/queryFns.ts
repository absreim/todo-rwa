import { TodoItem, UnidTodoItem } from "@/models/dtos";

export const getTodos: (apiPath: string) => () => Promise<Array<TodoItem>> = (apiPath) => async () => {
  const response = await fetch(`${apiPath}/TodoItems`);
  return await response.json();
};

export const getTodo: (apiPath: string) => (id: number) => Promise<TodoItem> = (apiPath) => async (id) => {
  const response = await fetch(`${apiPath}/TodoItems/${id}`);
  return await response.json();
};

export const addTodo: (apiPath: string) => (dto: UnidTodoItem) => Promise<TodoItem> = (apiPath: string) => async (
  dto,
) => {
  const response = await fetch(`${apiPath}/TodoItems`, {
    method: "POST",
    body: JSON.stringify(dto),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await response.json();
};

export const updateTodo: (apiPath: string) => (dto: TodoItem) => Promise<void> = (apiPath) => async (dto) => {
  const id = dto.id;
  await fetch(`${apiPath}/TodoItems/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const deleteTodo: (apiPath: string) => (id: number) => Promise<void> = (apiPath) => async (id) => {
  await fetch(`${apiPath}/TodoItems/${id}`, {
    method: "DELETE",
  });
};

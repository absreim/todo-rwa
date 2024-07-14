import { TodoItem, UnidTodoItem } from "@/models/dtos";

const apiPath = process.env.NEXT_PUBLIC_API_PATH

export const getTodos: () => Promise<Array<TodoItem>> = async () => {
  const response = await fetch(`${apiPath}/TodoItems`)
  return await response.json()
}

export const getTodo: (id: number) => Promise<TodoItem> = async (id) => {
  const response = await fetch(`${apiPath}/TodoItems/${id}`)
  return await response.json()
}

export const addTodo: (dto: UnidTodoItem) => Promise<TodoItem> = async (dto) => {
  const response = await fetch(`${apiPath}/TodoItems`, {
    method: 'POST',
    body: JSON.stringify(dto),
    headers: {
      "Content-Type": "application/json",
    }
  })
  return await response.json()
}

export const updateTodo: (dto: TodoItem) => Promise<void> = async (dto) => {
  const id = dto.id
  await fetch(`${apiPath}/TodoItems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
    headers: {
      "Content-Type": "application/json",
    }
  })
}

export const deleteTodo: (id: number) => Promise<void> = async (id) => {
  await fetch(`${apiPath}/TodoItems/${id}`, {
    method: 'DELETE'
  })
}

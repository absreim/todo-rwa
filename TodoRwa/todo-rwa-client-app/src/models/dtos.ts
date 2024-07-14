export interface UnidTodoItem
{
  name: string | null
  isComplete: boolean
}
export interface TodoItem extends UnidTodoItem {
  id: number
}

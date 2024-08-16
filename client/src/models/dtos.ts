export interface UnidTodoItem {
  name: string;
  isComplete: boolean;
}
export interface TodoItem extends UnidTodoItem {
  id: number;
}

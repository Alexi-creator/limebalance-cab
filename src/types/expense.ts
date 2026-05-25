export interface Category {
  id: string
  name: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  createdAt: string
  category: Category
}

export interface Income {
  id: string
  amount: number
  description: string
  createdAt: string
  category: Category
}

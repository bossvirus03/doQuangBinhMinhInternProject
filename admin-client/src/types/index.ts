export type Role = 'USER' | 'ADMIN'| 'TEACHER';

export interface JwtPayload {
  access_token: string
}

export interface User {
  id: number
  email: string
  name: string
  role: Role
  createdAt?: string
}

export interface NewsItem {
  id: number
  title: string
  content: string
  published: boolean
  authorId: number
  createdAt?: string
}

export interface ImportMeta {
  env: {
    VITE_API_URL: string
  }
}

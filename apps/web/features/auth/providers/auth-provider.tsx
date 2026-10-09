'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
  lastSeenAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
}

interface RegisterData {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const { user: userData, token } = await response.json()
      
      localStorage.setItem('auth_token', token)
      setUser(userData)
      
      toast({
        title: 'Welcome back!',
        description: `Good to see you again, ${userData.firstName || userData.username}`,
      })
      
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please check your credentials',
        variant: 'destructive',
      })
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      const { user: userData, token } = await response.json()
      
      localStorage.setItem('auth_token', token)
      setUser(userData)
      
      toast({
        title: 'Account created!',
        description: 'Welcome to SyncSpace. Let\'s get started.',
      })
      
      router.push('/onboarding')
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
      router.push('/auth/login')
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      })
    }
  }

  const updateUser = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await response.json()
      setUser(updatedUser)
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
      throw error
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/features/auth/providers/auth-provider'
import { toast } from '@/hooks/use-toast'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('auth_token')
      
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        setIsConnected(false)
        
        if (reason === 'io server disconnect') {
          // Server forcibly disconnected - probably auth issue
          toast({
            title: 'Connection lost',
            description: 'You have been disconnected. Please refresh the page.',
            variant: 'destructive',
          })
        }
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
        
        toast({
          title: 'Connection error',
          description: 'Failed to connect to real-time services.',
          variant: 'destructive',
        })
      })

      // Global error handler
      newSocket.on('error', (error) => {
        console.error('Socket error:', error)
        toast({
          title: 'Real-time error',
          description: error.message || 'Something went wrong with real-time updates.',
          variant: 'destructive',
        })
      })

      // Auto-reconnection feedback
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts')
        toast({
          title: 'Reconnected',
          description: 'Real-time connection has been restored.',
        })
      })

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection failed:', error)
      })

      setSocket(newSocket)

      return () => {
        console.log('Cleaning up socket connection')
        newSocket.close()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      // User not authenticated, clean up existing socket
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, user])

  const joinRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('join-room', room)
      console.log('Joined room:', room)
    }
  }

  const leaveRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('leave-room', room)
      console.log('Left room:', room)
    }
  }

  const value = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
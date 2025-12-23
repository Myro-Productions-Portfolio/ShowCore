import { useState, useEffect, useRef, useCallback } from 'react'

// Types
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
}

export interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastMessage: WebSocketMessage | null
}

export interface WebSocketOptions {
  reconnectAttempts?: number
  reconnectInterval?: number
  heartbeatInterval?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WebSocketMessage) => void
}

/**
 * Custom hook for WebSocket connections with auto-reconnect
 */
export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const {
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectCountRef = useRef(0)
  const messageQueueRef = useRef<WebSocketMessage[]>([])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }))
        reconnectCountRef.current = 0
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift()
          if (message) {
            ws.send(JSON.stringify(message))
          }
        }

        // Start heartbeat
        if (heartbeatInterval > 0) {
          heartbeatTimeoutRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
            }
          }, heartbeatInterval)
        }

        onOpen?.()
      }

      ws.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false }))
        
        if (heartbeatTimeoutRef.current) {
          clearInterval(heartbeatTimeoutRef.current)
        }

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }

        onClose?.()
      }

      ws.onerror = (error) => {
        setState(prev => ({ ...prev, error: 'WebSocket connection error', isConnecting: false }))
        onError?.(error)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setState(prev => ({ ...prev, lastMessage: message }))
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create WebSocket connection', isConnecting: false }))
    }
  }, [url, reconnectAttempts, reconnectInterval, heartbeatInterval, onOpen, onClose, onError, onMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastMessage: null,
    })
  }, [])

  const sendMessage = useCallback((type: string, payload: any) => {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(message)
    }
  }, [])

  // Connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
  }
}

/**
 * Hook for real-time messaging
 */
export function useRealtimeMessaging(userId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_message':
        setMessages(prev => [...prev, message.payload])
        break
      case 'user_online':
        setOnlineUsers(prev => [...prev.filter(id => id !== message.payload.userId), message.payload.userId])
        break
      case 'user_offline':
        setOnlineUsers(prev => prev.filter(id => id !== message.payload.userId))
        break
      case 'online_users':
        setOnlineUsers(message.payload.users)
        break
    }
  }, [])

  const ws = useWebSocket(
    `${process.env.VITE_WS_URL || 'ws://localhost:3001'}/ws?userId=${userId}`,
    {
      onMessage: handleMessage,
      onOpen: () => {
        console.log('Connected to messaging service')
      },
    }
  )

  const sendMessage = useCallback((recipientId: string, content: string) => {
    ws.sendMessage('send_message', {
      recipientId,
      content,
      timestamp: Date.now(),
    })
  }, [ws])

  const markAsRead = useCallback((messageId: string) => {
    ws.sendMessage('mark_read', { messageId })
  }, [ws])

  return {
    ...ws,
    messages,
    onlineUsers,
    sendMessage,
    markAsRead,
  }
}
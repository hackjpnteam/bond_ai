import { useState, useEffect, useCallback } from 'react'

export function useMessageCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread-count', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    
    // 30秒ごとに更新
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  return {
    unreadCount,
    refreshCount: fetchUnreadCount
  }
}
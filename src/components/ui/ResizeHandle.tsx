import { useEffect, useState } from 'react'

interface ResizeHandleProps {
  onResize: (delta: number) => void
  side: 'left' | 'right'
}

export function ResizeHandle({ onResize, side }: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      // Delta is positive if moving right
      const delta = e.movementX
      // If side is left (e.g. for a right-docked panel), moving right shrinks the panel
      onResize(side === 'right' ? delta : -delta)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, onResize, side])

  return (
    <div
      onMouseDown={() => setIsResizing(true)}
      className={`w-1.5 hover:w-1.5 group cursor-col-resize z-50 transition-colors flex items-center justify-center`}
      style={{
        marginLeft: side === 'right' ? -3 : 0,
        marginRight: side === 'left' ? -3 : 0,
      }}
    >
      <div 
        className={`w-px h-full transition-colors group-hover:bg-blue-500/50 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`} 
      />
    </div>
  )
}

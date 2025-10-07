import React from 'react'

interface GridIconProps {
  className?: string
  color?: string
}

const GridIcon: React.FC<GridIconProps> = ({ className = "w-6 h-6", color = "#7C3AED" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="5" height="5" rx="1.5" fill={color}></rect>
      <rect x="10" y="3" width="5" height="5" rx="1.5" fill={color}></rect>
      <rect x="17" y="3" width="4" height="5" rx="1.5" fill={color}></rect>
      <rect x="3" y="10" width="5" height="5" rx="1.5" fill={color}></rect>
      <rect x="10" y="10" width="5" height="5" rx="1.5" fill={color}></rect>
      <rect x="17" y="10" width="4" height="5" rx="1.5" fill={color}></rect>
      <rect x="3" y="17" width="5" height="4" rx="1.5" fill={color}></rect>
      <rect x="10" y="17" width="5" height="4" rx="1.5" fill={color}></rect>
      <rect x="17" y="17" width="4" height="4" rx="1.5" fill={color}></rect>
    </svg>
  )
}

export default GridIcon

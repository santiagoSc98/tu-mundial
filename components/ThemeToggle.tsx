'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="relative flex items-center justify-center h-9 w-9 rounded-xl overflow-hidden"
      style={{
        background: 'var(--toggle-bg)',
        border: '1px solid var(--toggle-border)',
      }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          background: isDark
            ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
        }}
        transition={{ duration: 0.4 }}
      />

      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <Moon className="h-4 w-4" style={{ color: '#a5b4fc' }} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <Sun className="h-4 w-4" style={{ color: '#f59e0b' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

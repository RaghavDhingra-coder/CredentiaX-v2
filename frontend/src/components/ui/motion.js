export const page = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
}

export const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
}

export const reveal = {
  initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export const cardHover = {
  whileHover: { y: -5, scale: 1.01 },
  transition: { type: 'spring', stiffness: 260, damping: 22 },
}

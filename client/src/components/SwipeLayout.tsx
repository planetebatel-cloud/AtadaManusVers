/*
 * ATADA — SwipeLayout
 * Design: Quiet Modernism — horizontal page navigation
 * Motion: Framer Motion spring, stiffness 300, damping 28
 * Supports: mouse drag, touch swipe, edge hover zones
 * Future: Add keyboard navigation (arrow keys)
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { createContext, useCallback, useContext, useState } from "react";
import { useSwipe } from "@/hooks/useSwipe";

interface SwipeLayoutContextType {
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  goNext: () => void;
  goPrev: () => void;
}

const SwipeLayoutContext = createContext<SwipeLayoutContextType>({
  currentPage: 0,
  totalPages: 0,
  goToPage: () => {},
  goNext: () => {},
  goPrev: () => {},
});

export function useSwipeLayout() {
  return useContext(SwipeLayoutContext);
}

interface SwipeLayoutProps {
  children: React.ReactNode[];
  initialPage?: number;
}

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

export function SwipeLayout({ children, initialPage = 0 }: SwipeLayoutProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [direction, setDirection] = useState(0);
  const totalPages = children.length;

  const goToPage = useCallback((page: number) => {
    if (page < 0 || page >= totalPages) return;
    setDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
  }, [currentPage, totalPages]);

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const { swipeState, handlers } = useSwipe({
    threshold: 80,
    velocityThreshold: 0.3,
    edgeZone: 40,
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  return (
    <SwipeLayoutContext.Provider value={{ currentPage, totalPages, goToPage, goNext, goPrev }}>
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          cursor: swipeState.isDragging ? "grabbing" : "default",
          userSelect: swipeState.isDragging ? "none" : "auto",
        }}
        {...handlers}
      >
        {/* Edge hover indicators */}
        <AnimatePresence>
          {swipeState.edgeHover === "left" && currentPage > 0 && (
            <motion.div
              key="edge-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-0 bottom-0 w-12 z-50 flex items-center justify-start pl-2"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.04), transparent)", pointerEvents: "none" }}
            >
              <div className="w-0.5 h-10 rounded-full bg-black/15" />
            </motion.div>
          )}
          {swipeState.edgeHover === "right" && currentPage < totalPages - 1 && (
            <motion.div
              key="edge-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-0 bottom-0 w-12 z-50 flex items-center justify-end pr-2"
              style={{ background: "linear-gradient(to left, rgba(0,0,0,0.04), transparent)", pointerEvents: "none" }}
            >
              <div className="w-0.5 h-10 rounded-full bg-black/15" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page slides */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="absolute inset-0 w-full h-full"
          >
            {children[currentPage]}
          </motion.div>
        </AnimatePresence>

        {/* Page indicator dots — bottom center */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-50 pointer-events-auto">
          {Array.from({ length: totalPages }).map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goToPage(i)}
              animate={{
                width: i === currentPage ? 20 : 6,
                background: i === currentPage ? "#0A0A0A" : "#D0D0D0",
              }}
              transition={{ duration: 0.2 }}
              style={{ height: 6, borderRadius: 3 }}
              className="block"
            />
          ))}
        </div>
      </div>
    </SwipeLayoutContext.Provider>
  );
}

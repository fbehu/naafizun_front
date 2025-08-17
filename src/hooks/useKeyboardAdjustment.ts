import { useEffect, useRef } from 'react';
import { useIsMobile } from './use-mobile';

export function useKeyboardAdjustment() {
  const isMobile = useIsMobile();
  const initialViewportHeight = useRef<number>(0);

  useEffect(() => {
    if (!isMobile) return;

    // Store initial viewport height
    initialViewportHeight.current = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      const currentHeight = window.visualViewport.height;
      const heightDifference = initialViewportHeight.current - currentHeight;
      
      // If keyboard is open (viewport height decreased significantly)
      if (heightDifference > 150) {
        // Find the focused input
        const focusedElement = document.activeElement as HTMLElement;
        if (focusedElement && (
          focusedElement.tagName === 'INPUT' || 
          focusedElement.tagName === 'TEXTAREA' ||
          focusedElement.tagName === 'SELECT'
        )) {
          // Wait a bit for the keyboard animation to complete
          setTimeout(() => {
            const rect = focusedElement.getBoundingClientRect();
            const viewportHeight = window.visualViewport!.height;
            
            // If input is in the bottom half and potentially covered
            if (rect.bottom > viewportHeight * 0.6) {
              const scrollAmount = rect.bottom - (viewportHeight * 0.4);
              window.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
              });
            }
          }, 300);
        }
      }
    };

    // Listen to visual viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    // Fallback for older browsers
    const handleResize = () => {
      if (!window.visualViewport) {
        handleViewportChange();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

  // Function to manually scroll input into view
  const scrollInputIntoView = (element: HTMLElement) => {
    if (!isMobile) return;

    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      
      if (rect.bottom > viewportHeight * 0.6) {
        const scrollAmount = rect.bottom - (viewportHeight * 0.4);
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  return { scrollInputIntoView };
}
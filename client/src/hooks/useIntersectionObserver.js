import { useEffect, useRef } from 'react';

/**
 * Custom hook for infinite scroll using Intersection Observer
 * @param {Object} options
 * @param {Function} options.onIntersect - Callback when element intersects
 * @param {boolean} options.enabled - Whether observer is enabled
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @returns {Object} - { observerTarget: ref }
 */
export const useIntersectionObserver = ({ 
  onIntersect, 
  enabled = true, 
  threshold = 0.1 
}) => {
  const observerTarget = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [onIntersect, enabled, threshold]);

  return { observerTarget };
};

export default useIntersectionObserver;

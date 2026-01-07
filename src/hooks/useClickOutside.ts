import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook that detects clicks outside of the specified element.
 * Useful for closing dropdowns, modals, and other overlay components.
 *
 * @param callback - Function to call when a click outside is detected
 * @param enabled - Whether the listener is active (default: true)
 * @returns RefObject to attach to the container element
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const containerRef = useClickOutside(() => setIsOpen(false), isOpen);
 *
 *   return (
 *     <div ref={containerRef}>
 *       <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
 *       {isOpen && <div>Dropdown content</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Use mousedown for faster response (before click completes)
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback, enabled]);

  return ref;
}

/**
 * Hook variant that accepts an existing ref instead of creating one.
 * Useful when you need the ref for other purposes as well.
 *
 * @param ref - Existing ref to the container element
 * @param callback - Function to call when a click outside is detected
 * @param enabled - Whether the listener is active (default: true)
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useClickOutsideRef(containerRef, () => setIsOpen(false), isOpen);
 *
 *   // Can also use containerRef for other purposes
 *   useEffect(() => {
 *     if (containerRef.current) {
 *       containerRef.current.focus();
 *     }
 *   }, []);
 *
 *   return <div ref={containerRef}>...</div>;
 * }
 * ```
 */
export function useClickOutsideRef<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T>,
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback, enabled]);
}

/**
 * Hook that detects clicks outside of multiple elements.
 * Useful when you have related elements (e.g., trigger button + dropdown).
 *
 * @param refs - Array of refs to check
 * @param callback - Function to call when a click outside all refs is detected
 * @param enabled - Whether the listener is active (default: true)
 *
 * @example
 * ```tsx
 * function Tooltip() {
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 *   const tooltipRef = useRef<HTMLDivElement>(null);
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   useClickOutsideMultiple([triggerRef, tooltipRef], () => setIsOpen(false), isOpen);
 *
 *   return (
 *     <>
 *       <button ref={triggerRef}>Hover me</button>
 *       {isOpen && <div ref={tooltipRef}>Tooltip</div>}
 *     </>
 *   );
 * }
 * ```
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const isOutside = refs.every(
        (ref) => ref.current && !ref.current.contains(event.target as Node)
      );

      if (isOutside) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, callback, enabled]);
}

export default useClickOutside;

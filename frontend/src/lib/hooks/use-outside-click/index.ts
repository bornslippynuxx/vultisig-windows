import { MutableRefObject, useEffect } from 'react';

export function useOutsideClick(
  ref: MutableRefObject<HTMLDivElement | null> | undefined,
  onClick: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref?.current && !ref?.current.contains(event.target as Node)) {
        onClick();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClick]);
}

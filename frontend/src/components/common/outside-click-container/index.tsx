import { PropsWithChildren, useRef } from 'react';

import { useOutsideClick } from '../../../lib/hooks/use-outside-click';

type OutsideClickContainerProps = {
  onClick: () => void;
};
export default function OutsideClickContainer({
  onClick,
  children,
}: PropsWithChildren<OutsideClickContainerProps>) {
  const wrapperRef = useRef(null);
  useOutsideClick(wrapperRef, onClick);

  return (
    <div ref={wrapperRef} className="flex">
      {children}
    </div>
  );
}

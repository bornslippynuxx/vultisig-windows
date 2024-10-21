import { PropsWithChildren, useMemo } from 'react';
import ReactModal from 'react-modal';

import { CloseIcon } from '../../../lib/ui/icons/CloseIcon';

type ModalBaseProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  fullScreenMobile?: boolean;
};

export default function ModalBase({
  open,
  onClose,
  title,
  subtitle,
  children,
  fullScreenMobile,
}: PropsWithChildren<ModalBaseProps>) {
  const popupInset = useMemo(() => {
    if (fullScreenMobile) {
      return 0;
    }
    return 40;
  }, [fullScreenMobile]);

  return (
    <ReactModal
      isOpen={open}
      onRequestClose={e => {
        e.stopPropagation();
        onClose();
      }}
      ariaHideApp={false}
      style={{
        content: {
          zIndex: 20,
          minWidth: 490,
          width: fullScreenMobile ? '100%' : 'fit-content',
          margin: fullScreenMobile ? 0 : 'auto',
          height: fullScreenMobile ? '100%' : 'fit-content',
          maxHeight: fullScreenMobile ? 'unset' : '720px',
          borderRadius: fullScreenMobile ? 0 : 12,
          background: '#19222E',
          border: '1px solid #1C2938',
          padding: '16px 20px',
          inset: popupInset,
        },
        overlay: {
          zIndex: 20,
          background: 'rgba(0,0,0,0.5)',
        },
      }}
    >
      <>
        <div className="flex w-full justify-between">
          <div>
            <p className="text-[24px] font-bold leading-tight">{title}</p>
            <span className="text-[12px] font-light text-neutral-300">
              {subtitle}
            </span>
          </div>
          <button
            className="rounded-[10px] w-[44px] h-[44px] flex items-center justify-center color-white ml-[8px] bg-blue-300 border-[1px] border-neutral-600"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </>
    </ReactModal>
  );
}

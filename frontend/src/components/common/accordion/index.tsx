import { MutableRefObject, PropsWithChildren, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import ArrowDownIcon from '../../../lib/ui/icons/ArrowDownIcon';

type AccordionProps = {
  title: string;
  buttonClassName?: string;
  arrowFill?: 'white' | 'grey' | '#A7A7A7' | '#ABBFC7';
  reverse?: boolean;
  onExpand?: () => void;
};

export default function Accordion({
  title,
  buttonClassName = '',
  arrowFill = 'white',
  reverse = false,
  onExpand,
  children,
}: PropsWithChildren<AccordionProps>) {
  const [isExpanded, setExpanded] = useState(false);
  const contentEl: MutableRefObject<any> = useRef();
  const { t } = useTranslation();

  const handleToggle = () => {
    if (!isExpanded && onExpand) {
      onExpand();
    }
    setExpanded(prev => !prev);
  };

  return (
    <div>
      <div>
        {!reverse && (
          <button
            onClick={handleToggle}
            className={`pl-[11px] py-[11px] flex items-center gap-[4px] overflow-hidden ${buttonClassName}`}
          >
            <span className="text-white font-medium">
              <Trans t={t}>{title}</Trans>
            </span>

            <div
              style={{
                transition: 'ease 0.3s',
                transform: isExpanded ? 'rotate(180deg)' : '',
                color: arrowFill === 'white' ? 'white' : arrowFill,
              }}
            >
              <ArrowDownIcon />
            </div>
          </button>
        )}

        <div
          ref={contentEl}
          className={!isExpanded ? 'overflow-hidden' : ''}
          style={{
            height: isExpanded ? contentEl.current.scrollHeight : 0,
            transition: 'height ease 0.3s',
          }}
        >
          {children}
        </div>
        {reverse && (
          <button
            onClick={handleToggle}
            className={`pl-[11px] py-[11px] flex items-center gap-[4px] overflow-hidden ${buttonClassName}`}
          >
            <span className="text-neutral-300 font-medium">
              <Trans t={t}>{title}</Trans>
            </span>
            <div
              style={{
                transition: 'ease 0.3s',
                transform: isExpanded ? 'rotate(180deg)' : '',
                color: arrowFill === 'white' ? 'white' : arrowFill,
              }}
            >
              <ArrowDownIcon />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

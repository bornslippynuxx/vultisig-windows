import { useState } from 'react';

import ArrowDownIcon from '../../../lib/ui/icons/ArrowDownIcon';
import FilterIcon from '../../../lib/ui/icons/FilterIcon';
import OutsideClickContainer from '../outside-click-container';

type SelectProps = {
  selectedValue: JSX.Element;
  options: JSX.Element;
  width: string;
  containerClassName?: string;
  menuContainerClassName?: string;
  showFilterIcon?: boolean;
};

export default function Select({
  selectedValue,
  options,
  width,
  showFilterIcon = true,
  containerClassName = '',
  menuContainerClassName = '',
}: SelectProps) {
  const [menuOpened, setMenuOpened] = useState(false);

  return (
    <div className={`w-${width}`}>
      <OutsideClickContainer onClick={() => setMenuOpened(false)}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
        <div
          className={`gap-[10px] bg-background-blue border-[1px] w-full border-neutral-500 px-[12px] py-[11px] rounded-[12px] flex justify-between items-center relative cursor-pointer ${containerClassName}`}
          style={{ color: '#A5A5A5', width: '100%' }}
          onClick={() => setMenuOpened(!menuOpened)}
        >
          <div className="gap-[10px] flex items-center">
            {showFilterIcon && <FilterIcon />}
            {selectedValue}
          </div>
          <div
            style={{
              transition: 'transform 0.5s',
              transform: menuOpened ? 'rotate(180deg)' : '',
              color: '#7E9EA8',
            }}
          >
            <ArrowDownIcon />
          </div>

          {menuOpened && (
            <div
              className={`bg-background-blue border-[1px] p-[6px] border-neutral-500 rounded-[12px] absolute top-[50px] left-0 z-20 max-h-[240px] overflow-y-auto ${menuContainerClassName} w-${width}`}
            >
              {options}
            </div>
          )}
        </div>
      </OutsideClickContainer>
    </div>
  );
}

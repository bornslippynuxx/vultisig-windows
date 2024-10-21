type DividerProps = {
  orientation: 'vertical' | 'horizontal';
};

export default function Divider({ orientation }: DividerProps) {
  return (
    <div
      className={`${
        orientation === 'vertical' ? 'h-auto w-[1px]' : 'w-full h-[1px]'
      } bg-neutral-500`}
    />
  );
}

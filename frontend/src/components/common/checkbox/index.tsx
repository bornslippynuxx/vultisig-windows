import CheckedIcon from '../../../lib/ui/icons/CheckedIcon';

type CheckboxProps = {
  disabled?: boolean;
  defaultChecked?: boolean;
  id: string;
  label: string;
  checked: boolean;
  onClick: () => void;
};

export default function Checkbox(props: CheckboxProps) {
  const { id, label, onClick } = props;
  return (
    <div className="w-full flex gap-2">
      <input
        className="
        peer relative shrink-0 appearance-none w-4 h-4 border-0 border-blue-500 rounded-sm mt-1 bg-grey6
        checked:bg-primary checked:border-0
        disabled:border-steel-400 disabled:bg-steel-400
      "
        type="checkbox"
        {...props}
        onClick={onClick}
      />
      <div className="absolute w-4 h-4 pointer-events-none hidden peer-checked:block stroke-white mt-1 outline-none">
        <CheckedIcon />
      </div>
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

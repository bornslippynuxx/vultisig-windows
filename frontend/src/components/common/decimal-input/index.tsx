import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from 'react';

type DecimalInputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  testId: string;
  error?: string;
  onChange: (e: any) => void;
  withError?: boolean;
};

// const MAX_NUMBER_OF_DIGITS = 18;

const isNumberInputValid = (value: string | number) => {
  return /^(0(\.\d{0,18})?|[1-9]\d*(\.\d{0,18})?)$/.test(value as string);
};

export default function DecimalInput({
  name,
  value,
  className,
  disabled,
  testId,
  error,
  onChange,
  withError = true,
  placeholder = '0.00',
}: DecimalInputProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && !isNumberInputValid(e.target.value as string)) {
      return;
    }
    onChange(e);

    // if (e.target.value.length <= MAX_NUMBER_OF_DIGITS) {
    //   onChange(e);
    // }
  };

  return (
    <div className="flex flex-col gap-[4px] flex-1">
      <input
        name={name}
        value={value}
        type="text"
        className={`${className} placeholder-neutral-200 focus:outline-none`}
        disabled={disabled}
        onChange={handleInputChange}
        placeholder={placeholder}
        autoComplete="off"
        data-test-id={testId}
      />
      {withError && error && (
        <span className="font-light text-[12px] -mt-3 w-fit text-alert-red">
          {error ? error : ''}
        </span>
      )}
    </div>
  );
}

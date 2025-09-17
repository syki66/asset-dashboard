'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  onChange: (selectedValues: string[]) => void;
  defaultSelected?: string[];
}

export default function CheckboxGroup({
  options,
  onChange,
  defaultSelected = [],
}: CheckboxGroupProps) {
  const [selectedValues, setSelectedValues] =
    useState<string[]>(defaultSelected);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const newSelectedValues = checked
      ? [...selectedValues, id]
      : selectedValues.filter((value) => value !== id);

    setSelectedValues(newSelectedValues);
    onChange(newSelectedValues);
  };

  // 선택 값 변경 시 부모에 전달
  useEffect(() => {
    onChange(selectedValues);
  }, [selectedValues, onChange]);

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={option.id}
            checked={selectedValues.includes(option.id)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(option.id, checked as boolean)
            }
            disabled={option.disabled}
          />
          <Label
            htmlFor={option.id}
            className={
              option.disabled ? 'text-gray-400 cursor-not-allowed' : ''
            }
          >
            {option.label}
            {option.disabled && (
              <span className="ml-1 text-xs text-gray-400">(추후 예정)</span>
            )}
          </Label>
        </div>
      ))}
    </div>
  );
}

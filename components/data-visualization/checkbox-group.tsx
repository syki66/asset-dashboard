'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[] | [];
  onChange: (selectedValues: string[]) => void;
  defaultSelected?: string[];
  allCheckedByDefault?: boolean;
}

export default function CheckboxGroup({
  options,
  onChange,
  defaultSelected = [],
  allCheckedByDefault = false,
}: CheckboxGroupProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(
    allCheckedByDefault ? options.map((option) => option.id) : defaultSelected
  );

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const newSelectedValues = checked
      ? [...selectedValues, id]
      : selectedValues.filter((value) => value !== id);

    setSelectedValues(newSelectedValues);
    onChange(newSelectedValues);
  };

  // Update parent component whenever selected values change
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
          />
          <Label htmlFor={option.id}>{option.label}</Label>
        </div>
      ))}
    </div>
  );
}

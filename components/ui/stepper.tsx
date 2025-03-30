'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: {
    id: string;
    label: string;
    description?: string;
  }[];
  activeStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  activeStep,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isCurrent = index === activeStep;
          const isClickable =
            onStepClick && (isCompleted || index === activeStep + 1);

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary bg-background text-primary'
                      : 'border-muted-foreground/20 bg-background text-muted-foreground',
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  )}
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-10 flex-1 rounded-full sm:mx-4 sm:w-20',
                    index < activeStep ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

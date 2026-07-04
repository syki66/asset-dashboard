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
      <div className='flex items-start'>
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isCurrent = index === activeStep;
          const isClickable =
            onStepClick && (isCompleted || index === activeStep + 1);

          return (
            <React.Fragment key={step.id}>
              <div className='flex min-w-0 flex-1 flex-col items-center'>
                <button
                  type='button'
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold shadow-sm backdrop-blur-sm transition-all duration-200',
                    isCompleted
                      ? 'border-[color:var(--setup-primary,var(--primary))] bg-[color:var(--setup-primary,var(--primary))] text-white shadow-[color:var(--setup-primary,var(--primary))]/20'
                      : isCurrent
                        ? 'border-[color:var(--setup-primary,var(--primary))]/60 bg-[color:var(--setup-primary,var(--primary))]/10 text-[color:var(--setup-primary,var(--primary))] shadow-[color:var(--setup-primary,var(--primary))]/10'
                        : 'border-white/20 bg-white/[0.08] text-muted-foreground',
                    isClickable
                      ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
                      : 'cursor-default',
                  )}
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className='h-5 w-5' />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className='mt-3 text-center'>
                  <div
                    className={cn(
                      'text-sm font-semibold leading-snug',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className='mt-1 text-xs leading-snug text-muted-foreground'>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 mt-5 h-0.5 flex-[0.8] rounded-full sm:mx-3',
                    index < activeStep
                      ? 'bg-[color:var(--setup-primary,var(--primary))]'
                      : 'bg-slate-400/35',
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

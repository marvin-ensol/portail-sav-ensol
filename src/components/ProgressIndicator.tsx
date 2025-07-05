interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const ProgressIndicator = ({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        return (
          <div 
            key={stepNumber}
            className={`h-2 w-8 rounded-full ${
              currentStep >= stepNumber ? 'bg-accent' : 'bg-muted'
            }`}
          />
        );
      })}
    </div>
  );
};

export default ProgressIndicator;
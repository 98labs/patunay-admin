import { useState } from "react";
import { FormStepTitle, PageHeader } from "@components";
import { ArtworkEntity, FormStepsEntity } from "@typings";

import Step1 from "./components/Step1";
import Step2 from "./components/Step2";
import Step3 from "./components/Step3";

const RegisterArtwork = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formSteps, setFormSteps] = useState<FormStepsEntity[]>([
    {
      stepNumber: 1,
      stepName: "Upload Artwork",
      complete: false,
    },
    {
      stepNumber: 2,
      stepName: "Enter Artwork",
      complete: false,
    },
    {
      stepNumber: 3,
      stepName: "Enter Artwork Size",
      complete: false,
    },
    {
      stepNumber: 4,
      stepName: "Enter Bibliography/s",
      complete: false,
    },
    {
      stepNumber: 5,
      stepName: "Enter Collector/s",
      complete: false,
    },
    {
      stepNumber: 6,
      stepName: "Attach to NFC Tag",
      complete: false,
    },
    {
      stepNumber: 7,
      stepName: "Artwork Details",
      complete: false,
    },
  ]);

  const [artwork, setArtwork] = useState<Partial<ArtworkEntity>>({});

  const handleOnStepClick = (stepNumber: number, complete: boolean) => {
    if (currentStep > stepNumber || complete) setCurrentStep(stepNumber);
  };

  const handleOnPrev = () => {
    setCurrentStep(currentStep - 1);
    setFormSteps(
      [...formSteps].map((formStep) =>
        formStep.stepNumber === currentStep
          ? { ...formStep, active: true, complete: false }
          : formStep
      )
    );
  };

  const handleOnNext = () => {
    setCurrentStep(currentStep + 1);
    setFormSteps(
      [...formSteps].map((formStep) =>
        formStep.stepNumber === currentStep
          ? { ...formStep, active: false, complete: true }
          : formStep
      )
    );
  };

  const handleOnDataChange = (data: { [key: string]: string }) => {
    setArtwork({ ...artwork, ...data });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader name="Register Artwork" />
      <div className="flex flex-1">
        {/* Left Column */}
        <div className="flex-1">
          <ul>
            {formSteps.map(({ stepNumber, stepName, complete }) => (
              <FormStepTitle
                key={stepNumber}
                className={
                  currentStep < stepNumber && !complete
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }
                stepNumber={stepNumber.toString()}
                stepName={stepName}
                active={currentStep === stepNumber}
                complete={complete}
                onClick={() => handleOnStepClick(stepNumber, complete)}
              />
            ))}
          </ul>
        </div>
        {/* Right Column */}
        {currentStep === 1 && <Step1 onNext={handleOnNext} />}
        {currentStep === 2 && (
          <Step2
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 3 && (
          <Step3
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
      </div>
    </div>
  );
};

export default RegisterArtwork;

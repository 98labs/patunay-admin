import { FormStepTitle, PageHeader } from "@components";
import { useEffect, useState } from "react";
import { ArtworkEntity, FormStepsEntity } from "../../typings";

import Bibliography from "./components/steps/Bibliography";
import Collector from "./components/steps/Collector";
import Info from "./components/steps/Info";
import Size from "./components/steps/Size";
import ReviewArtwork from "./components/steps/ReviewArtwork";
import UploadImage from "./components/steps/UploadImage";

const RegisterArtwork = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formSteps, setFormSteps] = useState<FormStepsEntity[]>([
    {
      stepNumber: 1,
      stepName: "Enter Artwork",
      complete: false,
    },
    {
      stepNumber: 2,
      stepName: "Enter Artwork Size",
      complete: false,
    },
    {
      stepNumber: 3,
      stepName: "Enter Bibliography/s",
      complete: false,
    },
    {
      stepNumber: 4,
      stepName: "Enter Collector/s",
      complete: false,
    },
    {
      stepNumber: 5,
      stepName: "Upload Images",
      complete: false,
    },
    {
      stepNumber: 6,
      stepName: "Review and Save Artwork",
      complete: false,
    },
  ]);

  const [artwork, setArtwork] = useState<Partial<ArtworkEntity>>({});
  const [addedArtwork, setAddedArtwork] = useState<ArtworkEntity | null>(null);

  const handleOnStepClick = (stepNumber: number, _complete: boolean) => {
    // if (currentStep > stepNumber) setCurrentStep(stepNumber);
    setCurrentStep(stepNumber);
  };

  const handleOnPrev = async () => {
    setCurrentStep(currentStep - 1);
    setFormSteps(
      [...formSteps].map((formStep) =>
        formStep.stepNumber === currentStep
          ? { ...formStep, active: true, complete: false, skip: false }
          : formStep
      )
    );
  };

  const handleOnNext = async () => {
    setCurrentStep(currentStep + 1);
    setFormSteps(
      [...formSteps].map((formStep) =>
        formStep.stepNumber === currentStep
          ? { ...formStep, active: false, complete: true, skip: false }
          : formStep
      )
    );
  };

  const handleOnSkip = async (stepsToSkip: number = 1) => {
    setCurrentStep(currentStep + stepsToSkip + 1);
    setFormSteps(
      formSteps.map((formStep) => {
        if (formStep.stepNumber === currentStep)
          return { ...formStep, active: false, complete: true, skip: false };

        if (
          formStep.stepNumber > currentStep &&
          formStep.stepNumber <= currentStep + stepsToSkip
        )
          return { ...formStep, active: false, complete: false, skip: true };

        return formStep;
      })
    );
  };

  const handleOnDataChange = (data: { [key: string]: string | string[] }) => {
    setArtwork({ ...artwork, ...data });
  };

  const handleAddArtworkResult = (addedArtwork: ArtworkEntity) => {
    setAddedArtwork(addedArtwork);
  };

  useEffect(() => {
    console.log("artwork", artwork);

    return () => {};
  }, [artwork]);

  return (
    <div className="flex flex-col h-full text-base-content dark:text-base-content bg-base-100 dark:bg-base-100">
      <PageHeader name="Register Artwork" />
      <div className="flex flex-1">
        {/* Left Column */}
        <div className="flex-1 bg-base-100 dark:bg-base-100 border-r border-base-300 dark:border-base-300 p-4">
          <ul className="space-y-2">
            {formSteps.map(({ stepNumber, stepName, complete, skip }) => (
              <FormStepTitle
                key={stepNumber}
                className={
                  currentStep < stepNumber && !complete
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-base-200 dark:hover:bg-base-200 rounded-lg"
                }
                stepNumber={stepNumber.toString()}
                stepName={stepName}
                active={currentStep === stepNumber}
                complete={complete}
                skip={skip}
                onClick={() => handleOnStepClick(stepNumber, complete)}
              />
            ))}
          </ul>
        </div>
        {/* Right Column */}
        {currentStep === 1 && (
          <Info
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 2 && (
          <Size
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 3 && (
          <Bibliography
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 4 && (
          <Collector
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 5 && (
          <UploadImage
            artwork={artwork}
            onDataChange={handleOnDataChange}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
          />
        )}
        {currentStep === 6 && (
          <ReviewArtwork
            artwork={addedArtwork ?? artwork}
            onAddArtwork={handleAddArtworkResult}
            onPrev={handleOnPrev}
          />
        )}
      </div>
    </div>
  );
};

export default RegisterArtwork;

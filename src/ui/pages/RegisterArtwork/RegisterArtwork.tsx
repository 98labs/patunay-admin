import { useEffect, useState } from "react";
import { FormStepTitle, PageHeader } from "@components";
import { ArtworkEntity, FormStepsEntity } from "../../typings";

import Step1Image from "./components/steps/Step1Image";
import Step2Info from "./components/steps/Step2Info";
import Step3Size from "./components/steps/Step3Size";
import Step4Bibliography from "./components/steps/Step4Bibliography";
import Step5Collector from "./components/steps/Step5Collector";
import Step6AttachNfc from "./components/steps/Step6AttachNfc";
import Step7Summary from "./components/steps/Step7Summary";

const RegisterArtwork = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formSteps, setFormSteps] = useState<FormStepsEntity[]>([
    {
      stepNumber: 1,
      stepName: "Upload Artwork (WIP)",
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
      stepName: "Attach to NFC Tag (WIP)",
      complete: false,
    },
    {
      stepNumber: 7,
      stepName: "Artwork Details",
      complete: false,
    },
  ]);

  const [artwork, setArtwork] = useState<Partial<ArtworkEntity>>({});
  const [addedArtwork, setAddedArtwork] = useState<ArtworkEntity | null>(null);

  const handleOnStepClick = (stepNumber: number, _complete: boolean) => {
    if (currentStep > stepNumber) setCurrentStep(stepNumber);
  };

  const handleOnPrev = async () => {
    setCurrentStep(currentStep - 1);
    setFormSteps(
      [...formSteps].map((formStep) =>
        formStep.stepNumber === currentStep
          ? { ...formStep, active: true, complete: false }
          : formStep
      )
    );
  };

  const handleOnNext = async () => {
    setCurrentStep(currentStep + 1);
    setFormSteps(
      [...formSteps].map((formStep) =>
        formStep.stepNumber === currentStep
          ? { ...formStep, active: false, complete: true }
          : formStep
      )
    );
  };

  const handleOnDataChange = (data: { [key: string]: string | string[] }) => {
    setArtwork({ ...artwork, ...data });
  };

  const handleAddArtworkResult = (addedArtwork: ArtworkEntity) => {
    setAddedArtwork(addedArtwork);
  };

  useEffect(() => {
    console.log("Updated artwork:\n", artwork);
  }, [artwork]);

  return (
    <div className="flex flex-col h-full text-base-content">
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
        {currentStep === 1 && <Step1Image onNext={handleOnNext} />}
        {currentStep === 2 && (
          <Step2Info
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 3 && (
          <Step3Size
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 4 && (
          <Step4Bibliography
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 5 && (
          <Step5Collector
            artwork={artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
            onDataChange={handleOnDataChange}
          />
        )}
        {currentStep === 6 && (
          <Step6AttachNfc
            data={artwork}
            addAddArtworkResult={handleAddArtworkResult}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
          />
        )}
        {currentStep === 7 && (
          <Step7Summary
            artwork={addedArtwork ?? artwork}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
          />
        )}
      </div>
    </div>
  );
};

export default RegisterArtwork;

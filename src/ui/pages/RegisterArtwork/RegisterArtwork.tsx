import { FormStepTitle, PageHeader } from "@components";
import { useEffect, useState } from "react";
import { ArtworkEntity, FormStepsEntity } from "../../typings";

import AttachNfc from "./components/steps/AttachNfc";
import Bibliography from "./components/steps/Bibliography";
import Collector from "./components/steps/Collector";
import Info from "./components/steps/Info";
import Size from "./components/steps/Size";
import Summary from "./components/steps/Summary";
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
      stepName: "Upload Artwork (WIP)",
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
    // if (currentStep > stepNumber) setCurrentStep(stepNumber);
    setCurrentStep(stepNumber);
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
    console.log("artwork", artwork);

    return () => {};
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
          <AttachNfc
            data={artwork}
            addAddArtworkResult={handleAddArtworkResult}
            onPrev={handleOnPrev}
            onNext={handleOnNext}
          />
        )}
        {currentStep === 7 && (
          <Summary
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

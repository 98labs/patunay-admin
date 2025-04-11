import { Button } from "@components";
import { ImageUp } from "lucide-react";

interface Props {
  onNext: () => void;
}

const Step1 = ({ onNext }: Props) => {
  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col items-center gap-2 p-24">
        <div>
          <ImageUp className="h-40 w-40 text-neutral-black-01" />
        </div>
        <div>
          <p className="font-medium">Drag and drop an artwork here, or</p>
        </div>
        <div>
          <Button buttonLabel="Upload an artwork" onClick={() => {}} />
        </div>
      </div>
      <Button
        buttonType="secondary"
        buttonLabel="Add image later"
        onClick={onNext}
      />
    </div>
  );
};

export default Step1;

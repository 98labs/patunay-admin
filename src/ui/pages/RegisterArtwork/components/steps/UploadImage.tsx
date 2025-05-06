import { Button } from "@components";
import { ImageUp } from "lucide-react";

interface Props {
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

const UploadImage = ({ onPrev, onNext }: Props) => {
  return (
    <div className="flex-2 h-fill flex flex-col justify-between gap-2">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col items-center gap-2 p-24">
        <div>
          <ImageUp className="h-40 w-40 text-neutral-black-01" />
        </div>
        <div>
          <p className="font-medium">Drag and drop an artwork here, or</p>
        </div>
        <div>
          <Button buttonLabel="Upload an artwork" onClick={async () => {}} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          buttonType="secondary"
          buttonLabel="Back"
          onClick={onPrev}
        />
        <Button
          className="flex-1"
          buttonType="primary"
          buttonLabel="Add image later"
          onClick={onNext}
        />
      </div>
    </div>
  );
};

export default UploadImage;

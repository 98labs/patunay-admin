import { Button, NfcListener } from "@components";

interface Props {
  onDataChange: (data: { [key: string]: string }) => void;
  onPrev: () => void;
  onNext: () => void;
}

const Step6 = ({ onDataChange, onPrev, onNext }: Props) => {
  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col items-center gap-2 p-24">
        <NfcListener />
      </div>
      <Button
        buttonType="secondary"
        buttonLabel="Attach artwork to NFC tag later"
        onClick={onNext}
      />
    </div>
  );
};

export default Step6;

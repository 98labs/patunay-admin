import { InputType } from "./enums/inputType";

export interface FormStepsEntity {
  stepNumber: number;
  stepName: string;
  complete: boolean;
}

export interface FormInputEntity {
  inputType?: InputType;
  artworkId: string;
  artworkLabel: string;
  hint: string;
  required: boolean;
}

export type FormErrorsEntity<T extends string = string> = Partial<
  Record<T, string>
>;

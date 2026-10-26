export type ApiErrors = Record<string, string[]>;

export interface ApiErrorsBody {
  errors: ApiErrors;
}

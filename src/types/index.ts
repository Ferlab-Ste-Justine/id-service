export enum Status {
  CREATED = 'CREATED',
  FOUND = 'FOUND',
  FAILED = 'FAILED',
}

export interface IIdStatus {
  status: Status;
  id: string;
}

export type IdStatus = IIdStatus;

export type KeyValuePairs = { [key: string]: any };

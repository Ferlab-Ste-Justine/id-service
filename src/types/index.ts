export enum Status {
  CREATED = 'CREATED',
  FOUND = 'FOUND',
  FAILED = 'FAILED',
}

export interface IIdStatus {
  status: Status;
  id: string;
}

export interface IIdsStatus {
  status: Status;
  rows: Row[];
}

export type IdStatus = IIdStatus;

export type KeyValuePairs = { [key: string]: any };

export type Row = {
  internal_id: string,
  hash: string
}

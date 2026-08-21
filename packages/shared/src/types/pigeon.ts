export enum PigeonSex {
  COCK = 'COCK',
  HEN = 'HEN',
}

export enum PigeonStatus {
  ACTIVE = 'ACTIVE',
  RETIRED = 'RETIRED',
  DECEASED = 'DECEASED',
}

export interface PigeonDto {
  id: string;
  ringNumber: string;
  name: string;
  sex: PigeonSex;
  color: string;
  birthYear: number;
  ownerId: string;
  status: PigeonStatus;
  createdAt: string;
  updatedAt: string;
}

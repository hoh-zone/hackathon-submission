import { ApyType } from 'cro-sdk';
import { ApyTypeLocal } from './dict.enum';
export interface dictItf {
  value: any;
  label: any;
}
export interface apyItf extends dictItf {
  value: ApyTypeLocal;
  label: ApyType;
}
export interface platformItf extends dictItf {
  value: string;
  label: string;
}

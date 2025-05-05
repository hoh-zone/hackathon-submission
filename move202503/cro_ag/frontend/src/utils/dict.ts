import { apyItf, dictItf } from '@/config/dict.interface';
import { ApyType } from 'cro-sdk';

export const translate = <T extends apyItf>(mapping: T[], value: T['value']) =>
  mapping.find((item) => item.value === value)?.label || ApyType.DEFAULT;

export const translateBase = <T extends dictItf>(
  mapping: T[],
  value: T['value']
) => mapping.find((item) => item.value === value)?.label;

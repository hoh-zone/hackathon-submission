import { ApyType } from 'cro-sdk';
import { ApyTypeLocal, Platforms } from './dict.enum';
import { apyItf, platformItf } from './dict.interface';

export const apyMapping: Array<apyItf> = [
  { value: ApyTypeLocal.DEFAULT, label: ApyType.DEFAULT },
  { value: ApyTypeLocal.STABLECOINS, label: ApyType.STABLECOINS },
  { value: ApyTypeLocal.LST, label: ApyType.LST },
  { value: ApyTypeLocal.DEFI, label: ApyType.DEFI },
  { value: ApyTypeLocal.MEME, label: ApyType.MEME },
];
export const platformMapping: Array<platformItf> = [
  { value: Platforms.KAI, label: 'https://icons.llama.fi/kai-finance.png' },
  {
    value: Platforms.NAVI,
    label: 'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/navi.jpeg/public',
  },
  {
    value: Platforms.SCA,
    label:
      'https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/scallop.jpeg/public',
  },
];

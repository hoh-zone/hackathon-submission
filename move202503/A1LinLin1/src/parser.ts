// src/parser.ts
import { detectAccessControl    } from './detectors/accessControl';
import { detectCallSafety       } from './detectors/callSafety';
import { detectFreezeBypass     } from './detectors/freezeBypass';
import { detectLogicDefect      } from './detectors/logicDefect';
import { detectOverflow         } from './detectors/overflow';
import { detectRandomnessMisuse } from './detectors/randomnessMisuse';
import { detectReentrancy       } from './detectors/reentrancy';
import type { Finding }         from './types';

export function auditMoveSource(source: string): Finding[] {
  return [
    ...detectAccessControl(source),
    ...detectCallSafety(source),
    ...detectFreezeBypass(source),
    ...detectLogicDefect(source),
    ...detectOverflow(source),
    ...detectRandomnessMisuse(source),
    ...detectReentrancy(source),
  ];
}


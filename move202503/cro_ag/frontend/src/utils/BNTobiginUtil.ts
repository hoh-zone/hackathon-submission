import BN from 'bn.js';

const BNTobigint = (bnValue: BN): bigint => {
  return BigInt(bnValue.toString());
};

export default BNTobigint;

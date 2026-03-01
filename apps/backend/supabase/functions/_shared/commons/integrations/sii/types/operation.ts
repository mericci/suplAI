import operations from '../constants/operations.ts';

type Keys = keyof typeof operations;
type Operation = (typeof operations)[Keys];

export default Operation;

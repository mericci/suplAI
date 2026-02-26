import operations from '../constants/operations.js';

type Keys = keyof typeof operations;
type Operation = (typeof operations)[Keys];

export default Operation;

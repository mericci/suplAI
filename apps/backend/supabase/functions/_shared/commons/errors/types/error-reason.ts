import { errorReasons } from '../constants/index.ts';

type Keys = keyof typeof errorReasons;
type ErrorReason = (typeof errorReasons)[Keys];

export default ErrorReason;

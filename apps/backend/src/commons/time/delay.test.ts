import { expect } from 'chai';
import { SinonSpy, spy } from 'sinon';
import delay from './delay';

describe('delay', () => {
  let setTimeoutSpy: SinonSpy;

  beforeEach(() => {
    setTimeoutSpy = spy(global, 'setTimeout');
  });

  afterEach(() => {
    setTimeoutSpy.restore();
  });

  it('[SUCCESS] Should be a function', () => {
    expect(typeof delay).to.equals('function');
  });

  it('[SUCCESS] Should delay the function execution by 1 second', async () => {
    const expectedTimeoutInMs = 1000;
    const onTimeoutCallbackSpy = spy();
    const result = await delay({
      timeInMs: expectedTimeoutInMs,
      onTimeout: onTimeoutCallbackSpy,
    });

    expect(result).to.equals(true);
    expect(onTimeoutCallbackSpy).to.have.been.calledOnce;
    expect(setTimeoutSpy).to.have.been.called;
    expect(setTimeoutSpy.getCall(0).args[1]).to.equals(expectedTimeoutInMs);
  });
});

import type { SinonStub } from 'sinon';
import sinon from 'sinon';
import { expect } from 'chai';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import get from './get';

describe('Get requests', () => {
  const requestUrl = faker.internet.url();
  let axiosGetStub: SinonStub;
  let axiosInterceptorsResponseStub: SinonStub;

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, 'get');
    axiosInterceptorsResponseStub = sinon.stub(
      axios.create().interceptors,
      'response',
    );
    const apiStubInstance = {
      get: axiosGetStub,
      interceptors: { response: { use: axiosInterceptorsResponseStub } },
    };
    const axiosCreateStub: SinonStub = sinon.stub(axios, 'create');
    axiosCreateStub.returns(apiStubInstance);
  });

  afterEach(() => {
    axiosGetStub.restore();
  });

  it('[SUCCESS] Should return same response as axios get', async () => {
    const dummyResponse = {
      data: {
        name: 'Name',
        number: 0,
      },
      headers: {
        name: 'Name',
      },
    };
    axiosGetStub.resolves(dummyResponse);
    const response = await get(requestUrl);
    expect(response).to.deep.equal(dummyResponse);
    expect(axiosGetStub).to.have.been.calledWith(requestUrl);
  });

  it('[SUCCESS] Should add retry if it is enabled', async () => {
    const dummyResponse = {
      data: {
        name: 'Name',
        number: 0,
      },
      headers: {
        name: 'Name',
      },
    };
    axiosGetStub.resolves(dummyResponse);
    const response = await get(requestUrl, undefined, true);
    expect(response).to.deep.equal(dummyResponse);
    expect(axiosGetStub).to.have.been.calledWith(requestUrl);
    expect(axiosInterceptorsResponseStub).to.have.been.called;
  });

  it('[ERROR] Should rejects with error if request fails', async () => {
    const axiosError = {
      response: {
        status: 422,
        data: 'Something went wrong',
      },
    };
    axiosGetStub.rejects(axiosError);

    const response = await get(requestUrl).catch((error) => error);

    expect(response.statusCode).to.equal(400);
    expect(response).to.have.property('message', 'Something went wrong');
    expect(axiosGetStub).to.have.been.calledWith(requestUrl);
  });
});

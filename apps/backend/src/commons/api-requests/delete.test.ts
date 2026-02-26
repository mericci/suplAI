import type { SinonStub } from 'sinon';
import sinon from 'sinon';
import { expect } from 'chai';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import deleteRequest from './delete';

describe('axios deleteRequest', () => {
  const requestUrl = 'url';
  const apiKey = 'api-key';
  let axiosDeleteStub: SinonStub;

  beforeEach(() => {
    axiosDeleteStub = sinon.stub(axios, 'delete');
  });

  afterEach(() => {
    axiosDeleteStub.restore();
  });

  const deleteOptions = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
  };

  it('[SUCCESS] Should be a function', () => {
    expect(typeof deleteRequest).to.equal('function');
  });

  it('[SUCCESS] Should return same response as axios delete', async () => {
    const dummyResponse = {
      data: {
        name: 'Name',
        number: 0,
      },
      headers: {
        name: 'Name',
      },
    };

    axiosDeleteStub.resolves(dummyResponse);
    const result = await deleteRequest({
      url: requestUrl,
      options: deleteOptions,
    });

    expect(result).to.deep.equal(dummyResponse);
    expect(axiosDeleteStub).to.have.been.calledOnceWith(requestUrl);
  });

  it('[ERROR] Should reject with error if delete request fails', async () => {
    const partialAxiosError = {
      response: {
        status: StatusCodes.BAD_REQUEST,
        data: 'Something went wrong',
      },
    };
    try {
      axiosDeleteStub.rejects(partialAxiosError);
      await deleteRequest({
        url: requestUrl,
        options: deleteOptions,
      });

      throw new Error('Should not trigger');
    } catch (error) {
      expect(error).to.have.property('statusCode', StatusCodes.BAD_REQUEST);
      expect(error).to.have.property('message', 'Something went wrong');
      expect(axiosDeleteStub).to.have.been.calledWith(requestUrl);
    }
  });
});

import type { SinonStub } from 'sinon';
import sinon from 'sinon';
import { expect } from 'chai';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import post from './post';

describe('Post requests', () => {
  const requestUrl = 'url';
  let axiosPostStub: SinonStub;

  beforeEach(() => {
    axiosPostStub = sinon.stub(axios, 'post');
  });

  afterEach(() => {
    axiosPostStub.restore();
  });

  it('[SUCCESS] Should return same response as axios post', async () => {
    const bodyParams = {
      name: 'Name',
    };
    const postOptions = {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer ApiKey',
      },
    };
    const dummyResponse = {
      data: {
        name: 'Name',
        number: 0,
      },
      headers: {
        name: 'Name',
      },
    };
    axiosPostStub.resolves(dummyResponse);
    const response = await post({
      url: requestUrl,
      body: bodyParams,
      options: postOptions,
    });
    expect(response).to.deep.equal(dummyResponse);
    expect(axiosPostStub).to.have.been.calledWith(requestUrl);
  });

  it('[ERROR] Should rejects with error if request fails', async () => {
    const bodyParams = {
      name: 'Name',
    };
    const postOptions = {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer ApiKey',
      },
    };
    const parcialAxiosError = {
      response: {
        status: 422,
        data: 'Something went wrong',
      },
    };
    axiosPostStub.rejects(parcialAxiosError);
    try {
      await post({
        url: requestUrl,
        body: bodyParams,
        options: postOptions,
      });
      throw new Error('Should have thrown error');
    } catch (error) {
      expect(error).to.have.property('statusCode', StatusCodes.BAD_REQUEST);
      expect(error).to.have.property('message', 'Something went wrong');
      expect(axiosPostStub).to.have.been.calledWith(requestUrl);
    }
  });
});

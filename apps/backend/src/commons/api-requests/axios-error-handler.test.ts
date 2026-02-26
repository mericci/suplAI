import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import axiosErrorHandler from './axios-error-handler';

describe('Axios Error Handler', () => {
  it('[SUCCESS] Should return bad request error', async () => {
    const codeMessage = {
      status: 422,
      message: 'Bad request error',
    };
    const error = axiosErrorHandler(codeMessage);
    expect(error).to.have.property('statusCode', StatusCodes.BAD_REQUEST);
    expect(error).to.have.property('message', 'Bad request error');
  });

  it('[SUCCESS] Should return internal server error', async () => {
    const codeMessage = {
      status: 500,
      message: 'Something went wrong',
    };
    const error = axiosErrorHandler(codeMessage);
    expect(error).to.have.property(
      'statusCode',
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    expect(error).to.have.property('message', 'Something went wrong');
  });
});

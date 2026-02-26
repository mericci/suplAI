const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

function initializeChaiPlugins() {
  chai.use(sinonChai);
}

initializeChaiPlugins();

exports.mochaHooks = {
  async afterEach() {
    sinon.restore();
  },
};

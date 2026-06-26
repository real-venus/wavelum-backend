const nock = require('nock');

class SorobanMockServer {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.scope = nock(baseUrl).persist();
  }

  mockMethod(method, resultOrError, isError = false, statusCode = 200, delay = 0) {
    // Remove existing interceptors for this method
    nock.removeInterceptor({
      hostname: this.baseUrl,
      path: '/',
      method: 'POST'
    });
    const interceptor = this.scope.post('/', body => body && body.method === method);
    
    if (delay > 0) {
      interceptor.delayConnection(delay);
    }
    
    interceptor.reply(statusCode, (uri, requestBody) => {
      const response = {
        jsonrpc: "2.0",
        id: requestBody.id
      };
      if (isError) {
        response.error = resultOrError;
      } else {
        response.result = resultOrError;
      }
      return response;
    });
  }

  mockGetHealth(sequence = 123456) {
    this.mockMethod('getLatestLedger', { sequence, id: "hash", protocolVersion: 20 });
  }

  mockGetLatestLedger(sequence = 123456) {
    this.mockMethod('getLatestLedger', { sequence, id: "hash", protocolVersion: 20 });
  }

  mockGetEvents(events = [], latestLedger = 123457) {
    this.mockMethod('getEvents', { events, latestLedger });
  }

  mockSimulateTransaction(result) {
    this.mockMethod('simulateTransaction', result);
  }

  mockErrorResponse(method, errorObj, status = 200) {
    this.mockMethod(method, errorObj.error, true, status);
  }

  mockTimeout(method, delay = 20000) {
    this.mockMethod(method, null, false, 200, delay);
  }

  clear() {
    nock.cleanAll();
  }
}

module.exports = SorobanMockServer;

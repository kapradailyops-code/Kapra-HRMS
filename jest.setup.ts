import '@testing-library/jest-dom';

// Polyfill required by Next.js edge runtime / server-side standard web requests
if (typeof Request === 'undefined' || typeof Response === 'undefined') {
    const { Request, Response, Headers } = require('node-fetch');
    global.Request = Request;
    global.Response = Response;
    global.Headers = Headers;
}

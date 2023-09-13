let API_URL = "/api";

/* Do not modify or remove this line. It allows us to redirect the API for grading. */
if (window.API_URL) API_URL = window.API_URL;

/* Subclass of Error for representing HTTP errors returned from the API.
   Exposes a status (the HTTP response status code) and message (a user-facing message).

   Example usage:
      throw new HTTPError(500, "This feature is not implemented"); */
export class HTTPError extends Error {
  /* status is the HTTP status, message is a user-facing error message. */
  constructor(status, message) {
    /* Call the Error constructor with the given message. */
    super(message);
    this.status = status;
  }
}

/* Make an API request.
   - method is the HTTP method.
   - path is the URI. It must begin with a /. Does not include API_URL.
   - body (optional) is the request body as a JS object that can be converted to JSON.

   The API is assumed to return JSON. If the response status is 200, the response body (as a JS object) is returned.
   If the response has any other status, an HTTPError is thrown, with its status set to the response status and its
   message set to the value of the `error` property of the response, which we assume is a user-facing error message. */
const apiRequest = async (method, path, body = null, apiKey) => {
    let options = {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: null
    }
    if (apiKey) {
      options.headers.Authorization = `Bearer ${apiKey}`;
    }
    if (body) {
        options.body = JSON.stringify(body);
    }
    let uri = API_URL + path;
    let response = await fetch(uri, options);
    if (response.status == 200) {
        return response.json();
    } else {
        throw new HTTPError(response.status, response.error);
    }
  };
export default apiRequest;
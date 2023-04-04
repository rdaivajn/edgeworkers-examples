import { logger } from 'log';
import { HLS, Clipper, ClippingMethod } from './hls.js';
import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import URLSearchParams from "url-search-params";
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';
import { ReadableStream, WritableStream } from 'streams';

const UNSAFE_RESPONSE_HEADERS = ['content-length', 'transfer-encoding', 'connection', 'vary',
  'accept-encoding', 'content-encoding', 'keep-alive',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'];

const clipper = new Clipper({method: ClippingMethod.PRECISE});

//const clipper = new Clipper({ method: ClippingMethod.SEGMENT_BOUNDARIES });

class HlsStream {

  constructor (clipInfoQP) {

    let readController = null;

    this.readable = new ReadableStream({
      start (controller) {
        readController = controller;
      }
    });

    // Write adds '\n'
    let write = function (msg) { readController.enqueue(`${msg}\n`); };

    // It buffers all the chunks & processes in the end
    let primaryResponseBody = '';

    async function processStream(buffer, done) {
      // If EOF we process the buffer & write the modified buffer
      if (done) {
        let manifestObject = HLS.parseManifest(primaryResponseBody);
        try {
          manifestObject =  clipper.clip(clipInfoQP, manifestObject);
          const modifiedManifest = HLS.stringifyManifest(manifestObject);
          write(modifiedManifest);
        } catch(error) {
          logger.log('E:Clipping failed due to: %s', error.message);
        }
        return;
      }
      primaryResponseBody = primaryResponseBody + buffer;
    }

    let completeProcessing = Promise.resolve();

    this.writable = new WritableStream({
      write (text) {
        completeProcessing = processStream(text, false);
      },
      close () {
        processStream('', true); // Signaling EOS
        completeProcessing.then(() => readController.close());
      }
    });
  }
}

function getSafeResponseHeaders(headers) {
  for (let unsafeResponseHeader of UNSAFE_RESPONSE_HEADERS) {
    if (unsafeResponseHeader in headers) {
      delete headers[unsafeResponseHeader];
    }
  }
  return headers;
}

export async function responseProvider (request) {

  var req_headers = request.getHeaders();
  delete req_headers["host"];

  if (request.url.includes('.m3u8')) {

    let keyValuePairs = new URLSearchParams(request.query);
    //For demo purpose we are reading the clip information from url query params. 
    //Customer could read this from EKV store.
    const clipInfoQP = keyValuePairs.get('clip');
    logger.log('D:clipping Info: %s', clipInfoQP);
    const response = await httpRequest(`${request.scheme}://${request.host}${request.url}`, {headers: req_headers});
    return createResponse(
      response.status,
      getSafeResponseHeaders(response.getHeaders()),
      response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new HlsStream('clip=' + clipInfoQP)).pipeThrough(new TextEncoderStream())
    );
  } else {
    //clipping logic is not executed for other file type
    const response = await httpRequest(`${request.scheme}://${request.host}${request.url}`, {headers: req_headers});
    return createResponse(
      response.status,
      getSafeResponseHeaders(response.getHeaders()),
      response.body
    );
  }
}
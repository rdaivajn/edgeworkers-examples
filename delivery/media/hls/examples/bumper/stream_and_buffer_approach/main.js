import { HLS } from './hls.js';
import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import URLSearchParams from "url-search-params";
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';
import { ReadableStream, WritableStream } from 'streams';

const UNSAFE_RESPONSE_HEADERS = ['content-length', 'transfer-encoding', 'connection', 'vary',
  'accept-encoding', 'content-encoding', 'keep-alive',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'];

function getSafeResponseHeaders(headers) {
  for (let unsafeResponseHeader of UNSAFE_RESPONSE_HEADERS) {
    if (unsafeResponseHeader in headers) {
      delete headers[unsafeResponseHeader];
    }
  }
  return headers;
}

class HLSStreamAndBufferApproach {
  constructor (bumperList) {
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
        let primaryPlaylistObject = HLS.parseManifest(primaryResponseBody);

        // inserting ads based on user inputs
        HLS.insertAuxiliaryContent(primaryPlaylistObject, bumperList);
        const modifiedResponseBody = HLS.stringifyManifest(primaryPlaylistObject);
        
        write(modifiedResponseBody);
        return;
      }

      primaryResponseBody = primaryResponseBody + buffer;
    }

    let completeProcessing = Promise.resolve();
    this.writable = new WritableStream({
      write (text) {
        completeProcessing = processStream(text, false)
      },
      close () {
        processStream('', true); // Signaling EOS
        completeProcessing.then(() => readController.close())
      }
    });
  }
}

export async function responseProvider (request) {
  let bumper;
  let bumperList = [];
  let keyValuePairs = new URLSearchParams(request.query);
  let bumper1RequestUrl; let bumper1Response; let bumper1ResponseBody; let bumper1ResponseBodyObject; 
  var req_headers = request.getHeaders();
  delete req_headers["host"];

  if (keyValuePairs.has('ad1') === true) {
    bumper1RequestUrl = `${request.scheme}://${request.host}/HLS-clear/rkalra/bumper/ad1/ad1_720p.m3u8?cns=1`;
    bumper1Response = await httpRequest(bumper1RequestUrl);
    bumper1ResponseBody = await bumper1Response.text();
    bumper1ResponseBodyObject = HLS.parseManifest(bumper1ResponseBody);

    if (keyValuePairs.get('ad1') == -1) {
      bumper = {auxiliaryPlayist: bumper1ResponseBodyObject, afterSeconds: Number.MAX_VALUE};
    } else {
      bumper = {auxiliaryPlayist: bumper1ResponseBodyObject, afterSeconds: keyValuePairs.get('ad1')};
    }

    bumperList.push(bumper);
  }

  let bumper2RequestUrl; let bumper2Response; let bumper2ResponseBody; let bumper2ResponseBodyObject;
  if (keyValuePairs.has('ad2') === true) {
    bumper2RequestUrl = `${request.scheme}://${request.host}/HLS-clear/rkalra/bumper/ad2/ad2_720p.m3u8?cns=1`;
    bumper2Response = await httpRequest(bumper2RequestUrl);
    bumper2ResponseBody = await bumper2Response.text();
    bumper2ResponseBodyObject = HLS.parseManifest(bumper2ResponseBody);

    if (keyValuePairs.get('ad2') == -1) {
      bumper = {auxiliaryPlayist: bumper2ResponseBodyObject, afterSeconds: Number.MAX_VALUE};
    } else {
      bumper = {auxiliaryPlayist: bumper2ResponseBodyObject, afterSeconds: keyValuePairs.get('ad2')};
    }

    bumperList.push(bumper);
  }

  let bumper3RequestUrl; let bumper3Response; let bumper3ResponseBody; let bumper3ResponseBodyObject;
  if (keyValuePairs.has('ad3') === true) {
    bumper3RequestUrl = `${request.scheme}://${request.host}/HLS-clear/rkalra/bumper/ad3/ad3_720p.m3u8?cns=1`;
    bumper3Response = await httpRequest(bumper3RequestUrl);
    bumper3ResponseBody = await bumper3Response.text();
    bumper3ResponseBodyObject = HLS.parseManifest(bumper3ResponseBody);

    if (keyValuePairs.get('ad3') == -1) {
      bumper = {auxiliaryPlayist: bumper3ResponseBodyObject, afterSeconds: Number.MAX_VALUE};
    } else {
      bumper = {auxiliaryPlayist: bumper3ResponseBodyObject, afterSeconds: keyValuePairs.get('ad3')};
    }

    bumperList.push(bumper);
  }

  const primaryResponse = await httpRequest(`${request.scheme}://${request.host}${request.path}`,{headers: req_headers});

  return createResponse(
    primaryResponse.status,
    getSafeResponseHeaders(primaryResponse.getHeaders()),
    primaryResponse.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new HLSStreamAndBufferApproach(bumperList))
      .pipeThrough(new TextEncoderStream())
  );
}
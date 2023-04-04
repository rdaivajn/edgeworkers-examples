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

class HlsStreamAndBufferApproach {
  constructor (request) {
    let readController = null;
    this.readable = new ReadableStream({
      start (controller) {
        readController = controller
      }
    });

    // Write adds '\n'
    let write = function (msg) { readController.enqueue(`${msg}\n`);};

    // It buffers all the chunks & processes in the end
    let responseBody = '';

    async function processStream(buffer, done) {
      // If EOF we process the buffer & write the modified buffer
      if (done) {
        let playlistObject = HLS.parseManifest(responseBody);
        let keyValuePairs = new URLSearchParams(request.query);

        /**
         * Bitrate Filtering with individual bitrates
         */
        if (keyValuePairs.has('br_in') === true) {
          let bitrate = keyValuePairs.get("br_in");
          let bitrates = bitrate.split(',');
          HLS.preserveVariantsByBitrate(playlistObject, bitrates);
        }

        /**
         * Bitrate Filtering with range of bitrates
         */
        if (keyValuePairs.has('br_in_range') === true) {
          let bitrate_range = keyValuePairs.get("br_in_range");
          let bitrates = [bitrate_range];
          HLS.preserveVariantsByBitrate(playlistObject, bitrates);
        }

        /**
         * Resolution Filtering
         */
        if (keyValuePairs.has('rs_device') === true) {
          let maxSupportedResolution = "960x540";
          HLS.preserveVariantsByResolution(playlistObject, maxSupportedResolution);
        }

        /**
         * Resolution Reordering
         */
        if (keyValuePairs.has('rs_order') === true) {
          let resolutions = ["1280x720", "960x540"];
          HLS.updateResolutionOrder(playlistObject, resolutions);
        }

        /**
         * Language Localization
         */
        if (keyValuePairs.has('lo_geo') === true) {
          let languages = ['fre'];
          HLS.preserveAudioRenditionsByLanguage(playlistObject, languages);
          HLS.preserveSubtitleRenditionsByLanguage(playlistObject, languages);
        }
        
        const body = HLS.stringifyManifest(playlistObject);
        write(body);
        return;
      }

      responseBody = responseBody + buffer;
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

export async function responseProvider (request) {
  var req_headers = request.getHeaders();
  delete req_headers["host"];
  return  httpRequest(`${request.scheme}://${request.host}${request.path}`, {headers: req_headers}).then(response => {
    return createResponse(
      response.status,
      getSafeResponseHeaders(response.getHeaders()),
      response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new HlsStreamAndBufferApproach(request)).pipeThrough(new TextEncoderStream())
    );
  });
}
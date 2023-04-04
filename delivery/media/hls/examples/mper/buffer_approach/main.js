import { logger } from 'log';
import { HLS } from './hls.js';
import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import URLSearchParams from "url-search-params";

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

export async function responseProvider (request) {
  
  var req_headers = request.getHeaders();
  delete req_headers["host"];
  const response = await httpRequest(`${request.scheme}://${request.host}${request.path}`, {headers: req_headers});
  const responseBody = await response.text();
  let keyValuePairs = new URLSearchParams(request.query);

  try {
    /**
     * parse unmodified/actual manifest
     */
    let playlistObject = HLS.parseManifest(responseBody);

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

    /**
     * Reconstruct the modified manifest
     */
    const modifiedResponseBody = HLS.stringifyManifest(playlistObject);

    return createResponse(
      response.status,
      getSafeResponseHeaders(response.getHeaders()),
      modifiedResponseBody
    );
  // log & handle exception
  } catch (error) {
    logger.log('ERROR=%s', error.message);
    return createResponse (
      400,
      {},
      JSON.stringify({ error: error.message })
    );
  }
}
# HLS Module 

The hls module can be used to demonstrate EW's capabilities of dynamically creating personalized versions of hls manifests based on parameters like device type, user geography, request headers or query string parameters.

## Some use cases supported in HLS module
- Manifest Personalization: Dynamically create personalized renditions of an existent VOD manifest, for HLS based on the device type, user geography, request headers or query string parameters without incurring any additional compute/changes on the customer origin.
- Clip creation: VOD clipping based on clipping information, by specifying a start and time.
- Bumper Insertion: Enables content providers to insert a video (bumper) in front/mid/end of a VOD asset (pre-roll/mid-roll/post-roll) based on the geolocation, time of the day, content-id, etc. Allowing them to comply with content rights restrictions, display local ratings and any other message. For example displaying the content ratings in the country’s language.

## Limitations
Currently the HLS parser accepts complete utf8 m3u8 file contents and do not work in streaming mode. (i.e chunks of data).

## Files
* **hls.js** is the main class you import in your main.js file. This file provides helper functions such as parseManifest to construct object from the manifest & populateManifest to reconstruct manifest back using objects.
* **hls.d.ts** is the typescript declaration file for hlsparser module.

## Documentation
Please visit this [page](http://) for complete documentation and usage of hlsparser module.

## Resources
Please see the examples [here](../examples/) for example usage of hlsparser.

### Todo
- [ ] Add documentation page link.
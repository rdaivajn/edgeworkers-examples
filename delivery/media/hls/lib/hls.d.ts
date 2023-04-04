/** @preserve @version 1.0.0 */

import { types } from 'hls-parser';
export { types } from 'hls-parser';

/**
 * @enum Defines types of manifest
 */
declare enum ManifestType {
    MASTER_MANIFEST = "Master Manifest",
    MEDIA_MANIFEST = "Media Manifest"
}
/**
 * Holder for auxiliary media playlist that will be inserted in primary media playlist at specified durration.
 */
declare type Bumper = {
    /**
     * Instance of {@link types.MediaPlaylist} that corresponds to the auxillary media playlist
     */
    auxiliaryPlayist: types.MediaPlaylist;
    /**
     * Duration(seconds) relative to primary media playlist where the segments from @param mediaPlayist will be inserted.
     * Value {@link Number.MAX_VALUE} indicates the segments from auxiliary media playlist needs to be inserted at the end in primary media playlist.
     * Value 0 indicates the segments from auxiliary media playlist needs to be inserted at the start in primary media playlist.
     */
    afterSeconds: number;
};
declare type ClipOptions = {
    method: ClippingMethod;
};
declare enum ClippingMethod {
    PRECISE = "PRECISE",
    SEGMENT_BOUNDARIES = "SEGMENT_BOUNDARIES"
}

/**
 * Clipper class provides functionality for clipping usecase. This class can be used to dynamically create video clips from an existing VOD asset, for HLS manifests. It will receive a query string with the clip parameters specifying a start time, and an optionally an end time, relative to the beginning of asset in seconds.
 */
declare class Clipper {
    private clipQP;
    private globalRegex;
    private clipOptions;
    /**
     * Creates instance of clipper class.
     * @param clipOptions Instance of {@link ClipOptions }. See {@link ClipOptions } for more details.
     */
    constructor(clipOptions?: ClipOptions);
    /**
     * Validates clip options field.
     * @param clipOptions Instance of {@link ClipOptions }
     * @throws {Error} with appropriate error message incase of any validation failure
     */
    private validateOptions;
    /**
     * Performs the clipping based on the playlist type.
     * If the playList is master playlist {@link ManifestType.MASTER_MANIFEST}, the @param clipInfo is added as query param to all playlist urls in master playlist and returned.
     * If the playList is media playlist {@link ManifestType.MEDIA_MANIFEST}, the clipped media playlist is returned.
     * @param clipInfo  Clipping information in the format clip=start[-end] where end is optional. Start and End should be integers denoting seconds relative to the beginning of asset. e.g. clip=122-3224 or clip=122.
     * @param playList  Instance of {@link types.MasterPlaylist} or {@link types.MediaPlaylist}
     * @returns Instance of {@link types.MasterPlaylist} or {@link types.MediaPlaylist} based upon @param playList input type.
     * @throws {Error} with appropriate error message in case of any failure proccesing or argument type checks.
     */
    clip(clipInfo: string, playList: types.MasterPlaylist | types.MediaPlaylist): types.MasterPlaylist | types.MediaPlaylist;
    /**
     * Validates clipInfo type and format.
     * @param clipInfo Clipping information in the format clip=start[-end] where end is optional. Start and End should be integers denoting seconds relative to the beginning of asset. e.g. clip=122-3224 or clip=122.
     * @returns Instance of {@link ClipInfo}
     * @throws {Error} with appropriate error message in case of validation failure.
     */
    private validateClipInfo;
    /**
     * Adds the clipping parameters as query params to playlist urls.
     * If the playlist urls already contains clip query params, it will bet overwritten.
     * @param clipingParams Instance of {@link ClipInfo}
     * @param playList      Instance of {@link types.MasterPlaylist}
     * @returns Instance of {@link types.MasterPlaylist}
     */
    private clipMasterPlaylist;
    /**
     * Performs clipping on the media playlist segments and returns the clipped media playlist.
     * @param clipingParams Instance of {@link ClipInfo}
     * @param playList      Instance of {@link types.MediaPlaylist}
     * @returns Instance of {@link types.MediaPlaylist}
     */
    private clipMediaPlaylist;
}

/**
 * This class exposes APIs to cater manifest personalization using edgeworkers.
 */
declare class HLS {
    /**
     * Parses input string to instance of {@link types.Playlist}. Refer {@link types.MasterPlaylist} / {@link types.MediaPlaylist} for more details.
     * @param text  UTF-8 encoded string representation of manifest
     * @returns     Instance of {@link types.MasterPlaylist} or {@link types.MediaPlaylist}.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Invalid input type, expected input of type string.') - If argument sent is not of type string.
     */
    static parseManifest(text: string): types.MasterPlaylist | types.MediaPlaylist;
    /**
     * Converts instance of {@link types.Playlist} to utf8 encoded string. Refer {@link types.MasterPlaylist} / {@link types.MediaPlaylist} for more details.
     * @param playlistObj Instance of {@link types.MasterPlaylist} or {@link types.MediaPlaylist}.
     * @returns           UTF-8 encoded string representation of manifest.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Received empty playlist object, expected master or media playlist object.') - If argument sent is not of type object.
     */
    static stringifyManifest(playlistObj: types.MasterPlaylist | types.MediaPlaylist): string;
    /**
     * Returns type of the playlist/manifest.
     * @param playlistObj Instance of {@link types.MasterPlaylist} or {@link types.MediaPlaylist}.
     * @returns           @enum representing the type of manifest. see {@link ManifestType} for enum types.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Received empty playlist object, expected master or media playlist object.') - If argument sent is not of type object.
     */
    static getManifestType(playlistObj: types.MasterPlaylist | types.MediaPlaylist): ManifestType;
    /**
     * Preserves variants with bandwiths of given bitrates & removes any other variants from master manifest.
     * @param playlistObj Instance of {@link types.MasterPlaylist}
     * @param bitrates    Array of string representation bitrates. e.g 100000, 10000-20000, 20000-, -300000.
     * @param tolerance   Bitrate offset. (Note: offset is not considered for bitrange of range type).
     * @returns           It returns boolean value where true infers that a variant matching given bitrate is removed & false infers that no variant is removed from the passed JS object.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Invalid bitrates type, expected array of strings.') - If bitrates sent is not of valid type.
     */
    static preserveVariantsByBitrate(playlistObj: types.MasterPlaylist, bitrates: string[], tolerance?: number): boolean;
    /**
     * Preserves variants with resolution less than @param maxSupportedResolution & removes resolution higher than @param maxSupportedResolution from master manifest.
     * It accepts single resolution as string in the format .
     * @param playlistObj             Instance of {@link types.MasterPlaylist}
     * @param maxSupportedResolution  String representation for resolution in format <width>x<height>
     * @returns                       It returns boolean value where true infers that a variant with resolution higher than given resolution is removed & false infers that no variant is removed from the passed JS object.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Invalid maximum supported resolution type, expected string in <width>x<height> format.') - If bitrates sent is not of valid type.
     */
    static preserveVariantsByResolution(playlistObj: types.MasterPlaylist, maxSupportedResolution: string): boolean;
    /**
     * Moves variant with given @param resolution to the @param position. in master manifest variants list. @param position is an optional parameter, if not passed the variant is moved to 0th index.
     * If there are multiple occurences of given @param resolution, it brings all of them in sequence starting from @param position.
     * @param playlistObj Instance of {@link types.MasterPlaylist}
     * @param resolution  String representation for resolution in format <width>x<height>
     * @param position    Index in the manifest's variants list where the variant with @param resolution needs to be moved.
     * @returns           Next position after the variant is moved to.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Invalid resolution type, expected string in <width>x<height> format.') - If bitrates sent is not of valid type.
     */
    static moveVariantToIndex(playlistObj: types.MasterPlaylist, resolution: string, position?: number): number;
    /**
     * Moves variants with given @param resolutions to the top.
     * Order of these variants are preserved as provided in @param resolutions.
     * Providing multiple entries of same resolution can cause undesired results.
     * @param playlistObj Instance of {@link types.MasterPlaylist}
     * @param resolutions Array of string representation for resolution in format <width>x<height>
     * @returns           Boolean where true infers that atleast one of the resolution order is updated as per given list of resolutions.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Received invalid playlist object, expected valid master playlist object.') - If playlist object sent is invalid.
     */
    static updateResolutionOrder(playlistObj: types.MasterPlaylist, resolutions: string[]): boolean;
    /**
     * Preserves audio renditions with given @param languages and removes any other audio renditions from master manifest.
     * @param playlistObj Instance of {@link types.MasterPlaylist}
     * @param languages   Array of strings with single or multiple langugages to be preserved. e.g ['EN','FR']. Note: Array of any other characters ([' '], ['abc']) can remove all audio renditions.
     * @returns           Boolean where true infers that atleast one audio rendition with language not matching the list of languages was removed.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Received invalid playlist object, expected valid master playlist object.') - If playlist object sent is invalid.
     */
    static preserveAudioRenditionsByLanguage(playlistObj: types.MasterPlaylist, languages: string[]): boolean;
    /**
     * Preserves subtitle renditions with given @param languages and removes any other subtitle renditions from master manifest.
     * @param playlistObj Instance of {@link types.MasterPlaylist}
     * @param languages   Array of strings with single or multiple langugages to be preserved. e.g ['EN','FR']. Note: Array of any other characters ([' '], ['abc']) can remove all subtitle renditions.
     * @returns           Boolean where true infers that atleast one subtitle rendition with language not matching the list of languages was removed.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Received invalid playlist object, expected valid master playlist object.') - If playlist object sent is invalid.
     */
    static preserveSubtitleRenditionsByLanguage(playlistObj: types.MasterPlaylist, languages: string[]): boolean;
    /**
     * Inserts the segments from auxiliary content to the primary media playlist at specifed duration.
     * This auxiliary content must be present as individual segments on the origin server & must have have its own playlist.
     * This auxiliary content can be inserted as pre/mid/post roll i.e this auxiliary content can be added before/middle/after the primary media playlist segments.
     * @param playlistObj Instance of {@link types.MediaPlaylist} that corresponds to the primary media playlist.
     * @param bumpersList List of auxiliary media playlist whose segments will be inserted before/middle/after the primary media playlist segments. Refer {@link Bumper} for more details.
     * @throws {[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)} with appropriate error message if argument type checks fails.
     * @example Error('Received invalid playlist object, expected valid master playlist object.') - If playlist object sent is invalid.
     */
    static insertAuxiliaryContent(playlistObj: types.MediaPlaylist, bumpers: Bumper[]): void;
}

export { Bumper, ClipOptions, Clipper, ClippingMethod, HLS, ManifestType };

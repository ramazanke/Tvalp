package com.alpica.tv;

import java.util.Locale;

/** A single HLS retry for URLs whose path cannot identify the stream format. */
final class StreamFormatPolicy {
    private StreamFormatPolicy() {}
    static boolean shouldTryHls(String path, boolean alreadyTried, boolean unsupportedContainer) {
        if (alreadyTried || !unsupportedContainer) return false;
        String value = path == null ? "" : path.toLowerCase(Locale.ROOT);
        String filename = value.substring(value.lastIndexOf('/') + 1);
        return !filename.contains(".") || filename.endsWith(".php") || filename.endsWith(".asp")
                || filename.endsWith(".aspx") || filename.endsWith(".jsp")
                || filename.endsWith(".cgi") || filename.endsWith(".m3u");
    }
}

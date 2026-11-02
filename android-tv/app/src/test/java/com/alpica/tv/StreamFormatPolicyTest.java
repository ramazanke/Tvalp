package com.alpica.tv;

import org.junit.Test;
import static org.junit.Assert.*;

public class StreamFormatPolicyTest {
    @Test public void phpHlsCanRetryWithoutChangingUrl() {
        assertTrue(StreamFormatPolicy.shouldTryHls("/vavo.php", false, true));
        assertTrue(StreamFormatPolicy.shouldTryHls("/VAVO.PHP", false, true));
    }
    @Test public void extensionlessUrlsCanRetry() {
        assertTrue(StreamFormatPolicy.shouldTryHls("/live/1221669131", false, true));
        assertTrue(StreamFormatPolicy.shouldTryHls(null, false, true));
        assertTrue(StreamFormatPolicy.shouldTryHls("/folder.with.dot/live", false, true));
    }
    @Test public void failedHlsCannotLoop() {
        assertFalse(StreamFormatPolicy.shouldTryHls("/vavo.php", true, true));
    }
    @Test public void networkAndDecoderFailuresDoNotChangeFormat() {
        assertFalse(StreamFormatPolicy.shouldTryHls("/vavo.php", false, false));
    }
    @Test public void knownFormatsKeepTheirOwnParser() {
        for (String path : new String[]{"/live.m3u8", "/live.mpd", "/movie.mp4", "/live.ts", "/music.mp3", "/movie.webm"}) {
            assertFalse(path, StreamFormatPolicy.shouldTryHls(path, false, true));
        }
    }
}

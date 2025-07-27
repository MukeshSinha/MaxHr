// src/utils/globalFetch.js

const baseTag = document.querySelector("base");
let basePath = baseTag?.getAttribute("href") ?? "/";

if (!basePath.endsWith("/")) {
    basePath += "/";
}

const originalFetch = window.fetch;

window.fetch = (input, init = {}) => {
    let url = input;

    // ✅ Only patch relative URLs (not starting with http:// or https:// or //)
    if (typeof input === "string" && !/^https?:\/\//i.test(input) && !input.startsWith("//")) {
        if (url.startsWith("/")) {
            url = url.slice(1); // remove leading /
        }

        // prepend basePath
        url = basePath + url;

        // remove accidental double slashes
        url = url.replace(/([^:]\/)\/+/g, "$1");
    }

    return originalFetch(url, init);
};

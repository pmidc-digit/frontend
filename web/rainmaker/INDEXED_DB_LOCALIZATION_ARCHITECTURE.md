# Localization System Architecture: IndexedDB & Caching Strategy

## 1. Overview
The localization system has been re-architected to improved performance, specifically addressing the high main-thread blocking time occurred during page loads. The new system utilizes **IndexedDB** for bulk data storage and **LocalStorage** for lightweight metadata (Manifest), enabling a "Manifest-First" caching strategy.

## 2. Key Architecture Components

### A. Storage Layers
1.  **LocalStorage (Metadata & Crucial Data):**
    *   `localization_manifest`: A JSON object storing the timestamp (`ts`) and validity of cached modules.
    *   `rainmaker-common`: Stored directly in localStorage for synchronous, immediate access during app bootstrapping.
    *   *Note:* Bulk localization data is NO LONGER stored here to prevent QuotaExceededErrors.

2.  **IndexedDB (Bulk Data):**
    *   Database Name: `rainmaker-db` (or similar, managed by `egov-ui-kit/utils/localStorageUtils`).
    *   Object Store: `localization`.
    *   Content: Stores the full array of localization objects for each module (e.g., `rainmaker-pgr`, `rainmaker-pt`).
    *   **Optimization:** Data is stored as raw JavaScript Arrays (not JSON strings) to avoid redundant serialization/deserialization overhead.

3.  **Redux Store (Runtime):**
    *   Holds the active localization labels for the current locale.
    *   Hydrated from IndexedDB on page load (Fast Path) or API (Slow Path).

### B. Caching Strategy: "Manifest-First"
The system avoids making network requests by checking the `localization_manifest` first.

*   **TTL (Time-To-Live):** Configured to **24 Hours**.
*   **Validation Logic:**
    ```javascript
    isCacheValid = (module) => {
        const record = manifest[module];
        if (!record) return false; // Not in cache
        if (Date.now() - record.ts > TTL) return false; // Expired
        return true;
    }
    ```

## 3. Data Flow

### A. Fast Path (Cache Hit)
Occurs when the User visits a page and the required modules are already in IndexedDB and valid.
1.  **Component Mounts:** Calls `fetchLocalizationLabel(locale, module)`.
2.  **Check Manifest:** System checks `localization_manifest` in LocalStorage.
3.  **Validation:** Finds the module is present and not expired (Freshness < 24h).
4.  **Retrieval:** Fetches data asynchronously from IndexedDB.
    *   *Optimization:* Detects if result is an Array. If so, skips `JSON.parse`.
5.  **Hydration:** Dispatches `ADD_LOCALIZATION` to Redux.
6.  **Network:** **0 API Calls** made.

### B. Slow Path (Cache Miss / Expiry)
Occurs on first visit or after 24 hours.
1.  **Validation:** Manifest check fails (missing or expired).
2.  **API Call:** Fetches `localization/messages/v1/_search` from server.
3.  **Storage Update:**
    *   Saves new data to IndexedDB.
    *   Update `localization_manifest` in LocalStorage with new Timestamp (`ts`).
4.  **Hydration:** Dispatches data to Redux.

## 4. Technical Optimizations implemented

### 1. Removing Serialization Overhead
*   **Before:** IndexedDB stored data as JSON Strings. Reading 3MB of data required `JSON.stringify` (write) and `JSON.parse` (read), blocking the main thread for 200ms-500ms.
*   **After:** `getLocalizationLabelsAsync` and `setLocalizationLabelsAsync` now handle raw JavaScript Objects/Arrays. This allows the browser's structured cloning algorithm to handle storage, keeping the main thread free.
    *   `src/utils/localStorageUtils/index.js` updated to return raw results.
    *   `src/redux/app/actions.js` updated to check `Array.isArray()` before parsing.

### 2. Request Deduplication
*   Multiple components asking for the same module (e.g., `rainmaker-pgr`) simultaneously are handled gracefully (though primarily managed by Redux state checks, the Manifest check is also idempotent).

### 3. Smart Storage Partitioning
*   **Common Labels:** Kept in LocalStorage for `sync` access (required for some synchronous utility functions).
*   **Module Labels:** Forced into IndexedDB. This separation prevents the 5MB LocalStorage limit from being hit.

## 5. Debugging & Maintenance

### Checking Cache Status
You can inspect the cache state in the Browser DevTools:
1.  **Application > Local Storage:** View `localization_manifest_en_IN`.
2.  **Application > IndexedDB:** View `rainmaker-db > localization` store.

### Clearing Cache
To force a fresh fetch:
1.  Clear LocalStorage (specifically `localization_manifest`).
2.  Reload the page. The system will treat this as a "First Visit".

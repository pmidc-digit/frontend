import { transformLocalizationLabels } from "egov-ui-kit/utils/commons";
import { getLocalization, getLocalizationLabelsAsync } from "egov-ui-kit/utils/localStorageUtils";

export const initLocalizationLabels = (locale) => {
  let localizationLabels;
  try {
    localizationLabels = getLocalization(`localization_${locale}`);
    localizationLabels = JSON.parse(localizationLabels);
    localizationLabels = transformLocalizationLabels(localizationLabels);
  } catch (error) {
    localizationLabels = {};
  }

  return localizationLabels;
};

/**
 * Async version that tries IndexedDB first, then falls back to localStorage
 * This is used for initial app load to leverage faster IndexedDB retrieval
 *
 * @param {string} locale - Language locale
 * @returns {Promise<object>} Transformed localization labels
 */
export const initLocalizationLabelsAsync = async (locale) => {
  try {
    // Try hybrid storage (IndexedDB first, localStorage fallback)
    const localizationData = await getLocalizationLabelsAsync(locale);

    if (localizationData) {
      const parsedLabels = JSON.parse(localizationData);
      const transformedLabels = transformLocalizationLabels(parsedLabels);
      console.log(`[Async Init] Loaded ${Object.keys(transformedLabels).length} localization keys`);
      return transformedLabels;
    }
  } catch (error) {
    console.warn('[Async Init] Failed to load from hybrid storage, using sync fallback:', error);
  }

  // Fallback to sync localStorage method
  return initLocalizationLabels(locale);
};

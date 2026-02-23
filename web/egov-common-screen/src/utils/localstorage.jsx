export const storage = {
  set: (key, value) => {
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error("LocalStorage Set Error:", error);
    }
  },

  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;

      try {
        return JSON.parse(value); // if object
      } catch {
        return value; // if normal string
      }
    } catch (error) {
      console.error("LocalStorage Get Error:", error);
      return null;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("LocalStorage Remove Error:", error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("LocalStorage Clear Error:", error);
    }
  },
};
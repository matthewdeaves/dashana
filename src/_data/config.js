const fs = require("fs");
const path = require("path");

module.exports = function () {
  const configPath = path.join(__dirname, "../../dashana.config");
  const config = {
    projectName: "Project Report",
    customerName: "Customer",
    siteBase: "", // Base path for subdirectory deployment (e.g., '/dashana')
  };

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    content.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        if (key.trim() === "PROJECT_NAME") config.projectName = value.trim();
        if (key.trim() === "CUSTOMER_NAME") config.customerName = value.trim();
        if (key.trim() === "SITE_BASE") config.siteBase = value.trim();
      }
    });
  } catch (_e) {
    console.warn("dashana.config not found, using defaults");
  }

  return config;
};

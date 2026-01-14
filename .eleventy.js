module.exports = function (eleventyConfig) {
  // Get version from environment (set by build script)
  const version = process.env.DASHANA_VERSION || null;

  // Build date for display in header (formatted as YYYY-MM-DD)
  const buildDate = new Date().toISOString().split("T")[0];

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addWatchTarget("dashana.config");

  // Clear config.js cache when dashana.config changes so it re-reads the file
  eleventyConfig.on("eleventy.beforeWatch", (changedFiles) => {
    if (changedFiles.some((file) => file.endsWith("dashana.config"))) {
      const configPath = require.resolve("./src/_data/config.js");
      delete require.cache[configPath];
    }
  });

  // Add version and build date to global data
  eleventyConfig.addGlobalData("version", version);
  eleventyConfig.addGlobalData("buildDate", buildDate);

  // Adjust paths if building a version
  if (version) {
    eleventyConfig.addGlobalData("pathPrefix", `/${version}`);
  } else {
    eleventyConfig.addGlobalData("pathPrefix", "");
  }

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
  };
};

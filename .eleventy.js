module.exports = function (eleventyConfig) {
  // Get version from environment (set by build script)
  const version = process.env.DASHANA_VERSION || null;

  // Build date for display in header (formatted as YYYY-MM-DD)
  const buildDate = new Date().toISOString().split("T")[0];

  // Load config to get siteBase
  const config = require("./src/_data/config.js")();
  // Auto-detect siteBase from GITHUB_REPOSITORY if not explicitly set
  // GITHUB_REPOSITORY is "owner/repo", we extract "repo" for the path
  let siteBase = config.siteBase;
  if (!siteBase && process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split("/")[1];
    siteBase = `/${repo}`;
  }
  siteBase = siteBase || "";

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

  // basePath: site base without version (for cross-version links)
  eleventyConfig.addGlobalData("basePath", siteBase);

  // pathPrefix: siteBase + optional version (for same-version links)
  let pathPrefix = siteBase;
  if (version) {
    pathPrefix = `${siteBase}/${version}`;
  }
  eleventyConfig.addGlobalData("pathPrefix", pathPrefix);

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

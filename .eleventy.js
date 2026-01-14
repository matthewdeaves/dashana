module.exports = function (eleventyConfig) {
  // Get version from environment (set by build script)
  const version = process.env.DASHANA_VERSION || null;

  eleventyConfig.addPassthroughCopy("src/css");

  // Add version to global data
  eleventyConfig.addGlobalData("version", version);

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

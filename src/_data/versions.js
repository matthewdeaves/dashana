const fs = require('fs');
const path = require('path');

module.exports = function() {
  // Allow mock versions for development/testing
  // Usage: DEV_VERSIONS=true npm run dev
  if (process.env.DEV_VERSIONS) {
    return ['2026-01-10', '2026-01-05', '2026-01-01'];
  }

  const versionsPath = path.join(__dirname, '../../_site/versions.json');

  try {
    const content = fs.readFileSync(versionsPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    // During development, versions.json doesn't exist yet
    return [];
  }
};

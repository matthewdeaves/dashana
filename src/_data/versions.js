const fs = require('fs');
const path = require('path');

module.exports = function() {
  const versionsPath = path.join(__dirname, '../../_site/versions.json');

  try {
    const content = fs.readFileSync(versionsPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    // During development, return empty array
    return [];
  }
};

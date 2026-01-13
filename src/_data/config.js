const fs = require('fs');
const path = require('path');

module.exports = function() {
  const configPath = path.join(__dirname, '../../dashana.config');
  const config = {
    projectName: 'Project Report',
    customerName: 'Customer'
  };

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        if (key.trim() === 'PROJECT_NAME') config.projectName = value.trim();
        if (key.trim() === 'CUSTOMER_NAME') config.customerName = value.trim();
      }
    });
  } catch (e) {
    console.warn('dashana.config not found, using defaults');
  }

  return config;
};

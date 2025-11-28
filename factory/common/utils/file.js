/**
 * File Utility
 */

const fs = require('fs').promises;

module.exports = {
    readJson: async (path) => {
        const data = await fs.readFile(path, 'utf8');
        return JSON.parse(data);
    },
    writeJson: async (path, data) => {
        await fs.writeFile(path, JSON.stringify(data, null, 2));
    }
};

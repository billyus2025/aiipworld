/**
 * Route Index
 */

const drama = require('./drama');
const novel = require('./novel');
const comic = require('./comic');
const tools = require('./tools');

module.exports = {
    ...drama,
    ...novel,
    ...comic,
    ...tools
};

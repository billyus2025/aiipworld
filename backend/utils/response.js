/**
 * Response Utility
 */

module.exports = {
    success: (data) => ({ success: true, data }),
    error: (msg) => ({ success: false, error: msg })
};

/**
 * Deep freezes an object and all its nested properties
 * Creates complete immutability by recursively freezing all nested objects
 * 
 * @param {Object} obj - Object to freeze
 * @returns {Object} Frozen object with all nested objects also frozen
 * @example
 * const config = deepFreeze({
 *     level1: {
 *         level2: {
 *             value: 'test'
 *         }
 *     }
 * });
 */
export default function deepFreeze(obj) 
{
    Object.keys(obj).forEach(prop => {
        if (typeof obj[prop] === 'object' && obj[prop] !== null) 
        {
            deepFreeze(obj[prop]);
        }
    });
    return Object.freeze(obj);
}

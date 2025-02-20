import ManageUser from "./ManageUser.js";

export default class TokenValidation {
    #token = null;
    #userManager;

    constructor() {
        this.#userManager = new ManageUser();
    }

    /**
     * Gets stored token from user settings
     * @returns {Promise<string|null>} Token or null if not found
     */
    async getUserToken() {
        try {
            console.log('In getUserToken: ');

            const userStatus = await this.#userManager.getSettings('user_status');
            console.log('userStatus: ', userStatus);
            const userToken = userStatus?.user_status?.userToken;

            return userToken ?? null;
        }
        catch (err) {
            console.warn('Error in getUserToken: ', err);

        }
    }

    /**
     * Sets token for validation
     * @param {string} token - Token to validate
     * @throws {Error} If token is invalid
     */
    async setToken(token) {
        if (!token) throw new Error('Invalid token provided');
        this.#token = token;
    }

    /**
     * Gets currently set token if valid
     * Just returns the token since validation is handled by userAuthorization
     * through checking user status and expiry
     * @returns {string|null} Current token or null
     * @throws {Error} If no token is set
     */
    getToken() {
        if (!this.#token) throw new Error('No token set');
        return this.#token;
    }
}
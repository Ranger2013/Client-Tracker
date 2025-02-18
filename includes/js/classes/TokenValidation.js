import errorLogs from "../utils/error-messages/errorLogs.js";
import ManageUser from "./ManageUser.js"; 
import IndexedDBOperations from "./IndexedDBOperations.js";

export default class TokenValidation {

	constructor() {
		this.userInfo = new ManageUser();
		this.indexed = new IndexedDBOperations();
		this.token = null;
	}

	async getUserToken() {
		try {
			const db = await this.indexed.openDBPromise();
			const userSettings = await this.indexed.getAllStorePromise(db, this.indexed.stores.USERSETTINGS);
			return userSettings[0]?.userToken || null;  // Changed from token to userToken
		} catch (err) {
			console.error('Error getting user token:', err);
			throw err;
		}
	}

	async validateToken(token) {
		if (!token) return { isValid: false };

		try {
			const db = await this.indexed.openDBPromise();
			const userSettings = await this.indexed.getAllStorePromise(db, this.indexed.stores.USERSETTINGS);
			
			if (!userSettings?.[0]) return { isValid: false };

			const { user_status } = userSettings[0];
			const now = new Date();
			let expiryDate = new Date(user_status.expiry);

			// Add 3-day grace period for members
			if (user_status.status === 'member') {
				expiryDate.setDate(expiryDate.getDate() + 3);
			}

			// Admin accounts never expire
			if (user_status.status === 'admin') {
				return { isValid: true };
			}

			return {
				isValid: now < expiryDate,
				status: user_status.status,
				uID: user_status.uID
			};
		} catch (err) {
			await errorLogs('tokenValidationError', 'Token validation error: ', err);
			return { isValid: false };
		}
	}

	async validateTokenWithServer(token) {
		try {
			const response = await fetch('/api/validate-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});

			if (!response.ok) {
				throw new Error('Token validation failed');
			}

			const data = await response.json();
			return {
				isValid: data.isValid,
				newToken: data.newToken // Server might issue a new token
			};
		} catch (err) {
			console.error('Token validation error:', err);
			return { isValid: false };
		}
	}

	async handleOfflineValidation(token) {
		try {
			const db = await this.indexed.openDBPromise();
			const userSettings = await this.indexed.getAllStorePromise(db, this.indexed.stores.USERSETTINGS);
			
			if (!userSettings?.[0]) {
				return { isValid: false, isOffline: true };
			}

			const { user_status } = userSettings[0];
			const now = new Date();
			let expiryDate = new Date(user_status.expiry);

			// Add 3-day grace period for members
			if (user_status.status === 'member') {
				expiryDate.setDate(expiryDate.getDate() + 3);
			}

			// Admins always valid when offline
			if (user_status.status === 'admin') {
				return { isValid: true, isOffline: true };
			}

			return {
				isValid: now < expiryDate,
				isOffline: true,
				status: user_status.status
			};
		} catch (err) {
			await errorLogs('offlineValidationError', 'Offline validation error: ', err);
			return { isValid: false, isOffline: true };
		}
	}

	setToken(userToken){
		return new Promise((resolve, reject) => {
			this.token = userToken;
			resolve(this.token);
		});		
	}

	getToken(){
		return new Promise((resolve, reject) => {
			if(this.token){
				resolve(this.token);
			}
			else {
				reject('Token not set');
			}
		});
	}
}
import { addListener } from '../../../core/utils/dom/listeners.js';

/**
 * Manages the installation process for the Tracker PWA application
 * @class ManageTrackerInstallApp
 */
export default class ManageTrackerInstallApp {
	/** @type {ManageTrackerInstallApp} The singleton instance */
	static #instance;

	/** @type {boolean} Debug mode flag */
	#debug = false;

	/** @type {Object|null} The deferred install prompt */
	#deferredPrompt = null;

	/** @type {string} The component for event listener clean up */
	static COMPONENT_ID = 'tracker-install-manager';

	/** @type {boolean} Whether the app is running on iOS */
	#isIOS;

	/** @type {boolean} Whether the app is running in standalone mode */
	#isStandalone;

	/**
	 * Gets the singleton instance of the class
	 * @param {Object} [options] - Configuration options
	 * @param {boolean} [options.debug=false] - Whether to enable debug logging
	 * @returns {ManageTrackerInstallApp} The singleton instance
	 */
	static getInstance(options = {}) {
		if (!ManageTrackerInstallApp.#instance) {
			ManageTrackerInstallApp.#instance = new ManageTrackerInstallApp(options);
		}
		return ManageTrackerInstallApp.#instance;
	}

	/**
	 * Creates a new ManageTrackerInstallApp instance
	 * @param {Object} [options] - Configuration options
	 * @param {boolean} [options.debug=false] - Whether to enable debug logging
	 */
	constructor(options = {}) {
		// Enforce singleton pattern
		if (ManageTrackerInstallApp.#instance) {
			return ManageTrackerInstallApp.#instance;
		}

		this.#debug = !!options.debug;
		this.#isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		this.#isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator.standalone === true);

		this.#debugLog('Initializing ManageTrackerInstallApp');
		this.#debugLog('Running on iOS:', this.#isIOS);
		this.#debugLog('Running in standalone mode:', this.#isStandalone);

		// Set up install prompt listener
		this.#setupInstallPromptListener();

		// Save instance
		ManageTrackerInstallApp.#instance = this;
	}

	/**
	 * Logs debug messages if debug mode is enabled
	 * @param {...any} args - Arguments to log
	 * @private
	 */
	#debugLog(...args) {
		if (this.#debug) {
			console.log('[ManageTrackerInstallApp]', ...args);
		}
	}

	/**
	 * Sets up the beforeinstallprompt event listener
	 * @private
	 */
	#setupInstallPromptListener() {
		addListener({
			elementOrId: window,
			eventType: 'beforeinstallprompt',
			handler: (evt) => {
				evt.preventDefault();
				this.#deferredPrompt = evt;
				this.#debugLog('Install prompt captured and deferred');
			},
			componentId: ManageTrackerInstallApp.COMPONENT_ID,
		});
	}

	/**
	 * Checks if the app can be installed
	 * @returns {boolean} Whether the app can be installed
	 */
	canInstall() {
		return !!this.#deferredPrompt || this.#isIOS;
	}

	/**
	 * Gets information about the current platform
	 * @returns {Object} Platform information
	 */
	getPlatformInfo() {
		return {
			isIOS: this.#isIOS,
			isStandalone: this.#isStandalone
		};
	}

	/**
	 * Prompts the user to install the application using the native browser UI
	 * @returns {Promise<boolean>} Whether the installation was successful
	 */
	async promptForInstall() {
		try {
			// Only proceed if we have a deferred prompt
			if (!this.#deferredPrompt) {
				this.#debugLog('No deferred prompt available');
				return false;
			}

			// Show the installation prompt
			this.#debugLog('Showing deferred installation prompt');
			this.#deferredPrompt.prompt();

			// Wait for the user's choice
			const choiceResult = await this.#deferredPrompt.userChoice;

			// Reset the deferred prompt - it can only be used once
			this.#deferredPrompt = null;

			// Check if the user accepted
			const wasAccepted = choiceResult.outcome === 'accepted';
			this.#debugLog('Installation prompt result:', wasAccepted ? 'accepted' : 'dismissed');

			return wasAccepted;
		} catch (err) {
			this.#debugLog('Error showing install prompt:', err);
			return false;
		}
	}
}
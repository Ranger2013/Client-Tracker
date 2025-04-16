import IndexedDBOperations from '../../../core/database/IndexedDBOperations.js';
import { dataAPI } from '../../../core/network/api/apiEndpoints.js';
import { fetchData } from '../../../core/network/services/network.js';
import { safeDisplayMessage } from '../../../core/utils/dom/messages.js';
import { getValidationToken } from '../../../tracker.js';

export class TransferDataManager {
    #manageUser;
    #indexed;
    #indicators = new Map();

    static #COLOR_MAP = {
        green: "/public/siteImages/indicator_green_light.webp",
        red: "/public/siteImages/indicator_red_light.png",
        yellow: "/public/siteImages/indicator_yellow_light.webp",
        orange: "/public/siteImages/indicator_orange_light.png" // New for partial success
    };

    static #TRANSFER_STATUS = {
        SUCCESS: 'success',
        PARTIAL: 'partial',
        FAILED: 'failed',
        NO_DATA: 'no-data',
        ERROR: 'error',
        SERVER_ERROR: 'server-error',
        AUTH_ERROR: 'auth-error'
    };

    constructor(manageUser) {
        this.#manageUser = manageUser;
        this.#indexed = new IndexedDBOperations();
    }

    async transferData() {
        const results = await Promise.allSettled(
            this.#getTransferConfigs().map(async config => {
                // Get and set indicator to yellow at start of each transfer
                const indicator = this.#getIndicator(config.imgIndicatorId);
                this.#updateIndicator(indicator, 'yellow');
                
                try {
                    return await this.#processTransferData(config);
                } catch (err) {
                    console.warn(`Transfer failed for ${config.label}:`, err);
                    return {
                        status: 'failed',
                        label: config.label,
                        error: err.message
                    };
                }
            })
        );

        this.#handleTransferResults(results);
    }

    #getTransferConfigs() {
        return [
            {
                api: dataAPI.transfer,
                table: 'clients',
                localStore: this.#indexed.stores.CLIENTLIST,
                imgIndicatorId: 'clients-indicator',
                label: 'Client Data'
            },
            {
                api: dataAPI.transfer,
                table: 'trimming',
                localStore: this.#indexed.stores.TRIMMING,
                imgIndicatorId: 'trimmings-indicator',
                label: 'Trimming Data'
            },
            {
                api: dataAPI.transfer,
                table: 'personal_notes',
                localStore: this.#indexed.stores.PERSONALNOTES,
                imgIndicatorId: 'personal-notes-indicator',
                label: 'Personal Notes'
            },
            {
                api: dataAPI.transfer,
                table: 'date_time',
                localStore: this.#indexed.stores.USERSETTINGS,
                imgIndicatorId: 'date-time-indicator',
                label: 'Date/Time Settings'
            },
            {
                api: dataAPI.transfer,
                table: 'farrier_prices',
                localStore: this.#indexed.stores.USERSETTINGS,
                imgIndicatorId: 'farrier-prices-indicator',
                label: 'Farrier Prices'
            },
            {
                api: dataAPI.transfer,
                table: 'mileage_charges',
                localStore: this.#indexed.stores.USERSETTINGS,
                imgIndicatorId: 'mileage-charges-indicator',
                label: 'Mileage Charges'
            },
            {
                api: dataAPI.transfer,
                table: 'schedule_options',
                localStore: this.#indexed.stores.USERSETTINGS,
                imgIndicatorId: 'schedule-options-indicator',
                label: 'Schedule Options'
            },
            {
                api: dataAPI.transfer,
                table: 'color_options',
                localStore: this.#indexed.stores.USERSETTINGS,
                imgIndicatorId: 'color-options-indicator',
                label: 'Color Options'
            }
        ];
    }

    async #processTransferData(config) {
        const indicator = this.#getIndicator(config.imgIndicatorId);

        try {
            const response = await fetchData({
                api: config.api,
                data: { table: config.table },
                token: getValidationToken()
            });

            console.log('Server Response: ', response);
            if (!response) {
                throw new Error('No response received from server');
            }

            return await this.#handleResponse(response, config, indicator);
        } catch (err) {
            this.#updateIndicator(indicator, 'red');
            throw err;
        }
    }

    async #handleResponse(response, config, indicator) {
        const { status, data, maxID, store, property } = response;

        switch (status) {
            case TransferDataManager.#TRANSFER_STATUS.SUCCESS:
                return await this.#handleSuccessResponse({
                    response, config, indicator
                });

            case TransferDataManager.#TRANSFER_STATUS.NO_DATA:
                this.#updateIndicator(indicator, 'orange');
                return { status: 'no-data', message: response.msg };

            case TransferDataManager.#TRANSFER_STATUS.ERROR:
            case TransferDataManager.#TRANSFER_STATUS.AUTH_ERROR:
            case TransferDataManager.#TRANSFER_STATUS.SERVER_ERROR:
                this.#updateIndicator(indicator, 'red');
                return { status: status, message: response.msg };
        }
    }

    async #handleSuccessResponse({ response, config, indicator }) {
        const { data, maxID, store, property } = response;
        const db = await this.#indexed.openDBPromise();
        
        try {
            // Handle user settings (single object data with property)
            if (store === 'user_settings') {
                const settingsResult = await this.#handleUserSettings({
                    data, property, indicator
                });
                return { ...settingsResult, type: 'settings' };
            }
            
            // Handle data stores (array data with maxID)
            const results = [];
            
            // Store the data array if present
            if (Array.isArray(data)) {
                const storeResult = await this.#handleObjectStore({
                    db, store, data, indicator
                });
                results.push({ ...storeResult, type: 'store' });
            }

            // Store the maxID if present
            if (maxID?.length) {
                const maxIDResult = await this.#handleMaxIDs({
                    db, maxID, indicator
                });
                results.push({ ...maxIDResult, type: 'maxid' });
            }

            // Determine final status
            if (results.length === 0) {
                throw new Error(`Invalid response format for ${store}`);
            }

            const finalStatus = results.every(r => r.status === 'success') ? 'success' :
                              results.every(r => r.status === 'failed') ? 'failed' : 'partial';
            
            this.#updateIndicator(indicator,
                finalStatus === 'success' ? 'green' :
                finalStatus === 'partial' ? 'orange' : 'red'
            );

            // Add type 'store' to the combined result for multi-operation transfers
            return results.length === 1 ? results[0] : { results, status: finalStatus, type: 'store' };
        } catch (err) {
            this.#updateIndicator(indicator, 'red');
            throw err;
        }
    }

    #handleTransferResults(results) {
        const summary = results.reduce((acc, result) => {
            if (result.status === 'fulfilled') {
                if (result.value.status === 'no-data') {
                    if (!acc.noData) acc.noData = [];
                    acc.noData.push(result.value);
                } else if (result.value.status === 'server-error') {
                    if (!acc.serverErrors) acc.serverErrors = [];
                    acc.serverErrors.push(result.value);
                } else {
                    // Make sure the array exists before pushing
                    const type = result.value.type || 'unknown';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(result.value);
                }
            } else {
                if (!acc.errors) acc.errors = [];
                acc.errors.push(result.reason);
            }
            return acc;
        }, { settings: [], store: [], maxid: [], errors: [], noData: [], serverErrors: [] });

        this.#displayTransferSummary(summary);
    }

    #displayTransferSummary(summary) {
        let message = [];
        
        if (summary.errors?.length) {
            message.push(`Failed transfers: ${summary.errors.length}`);
        }

        if (summary.serverErrors?.length) {
            message.push(`Server errors: ${summary.serverErrors.length}`);
        }
        
        if (summary.noData?.length) {
            message.push(`No data available: ${summary.noData.length}`);
        }
        
        const partial = summary.store?.filter(s => s.status === 'partial') || [];
        if (partial.length) {
            message.push(`Partial transfers: ${partial.length}`);
        }
console.log('Summary:', summary);
        // Count successful transfers:
        // 1. Count all settings entries
        // 2. Count store entries but don't include maxID entries in the count
        const successful = (summary.settings?.length || 0) + 
                          (summary.store?.filter(s => !s.type?.includes('maxid')).length || 0);

        if (successful) {
            message.push(`Successful transfers: ${successful}`);
        }

        const total = successful + 
                     (summary.errors?.length || 0) +
                     (summary.serverErrors?.length || 0) +
                     (summary.noData?.length || 0);
        message.push(`Total transfers processed: ${total} of 8`);

        safeDisplayMessage({
            elementId: 'form-msg',
            message: message.join('<br>'),
            isSuccess: !summary.errors?.length && !summary.serverErrors?.length
        });
    }

    #getIndicator(id) {
        if (!this.#indicators.has(id)) {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Indicator element with id "${id}" not found`);
            }
            this.#indicators.set(id, element);
        }
        return this.#indicators.get(id);
    }

    #updateIndicator(indicator, color) {
        if (indicator && TransferDataManager.#COLOR_MAP[color]) {
            indicator.src = TransferDataManager.#COLOR_MAP[color];
        }
    }

    async #handleUserSettings({ data, property, indicator }) {
        try {
            await this.#indexed.openDBPromise();
            
            const success = await this.#manageUser.updateLocalUserSettings({
                userData: data,
                settingsProperty: property,
                waitForCompletion: true
            }).catch(err => {
                console.warn(`Settings update failed for ${property}:`, err);
                return false;
            });

            // Only verify if initial update succeeded
            let verified = false;
            if (success) {
                const settings = await this.#manageUser.getSettings(property);
                verified = settings && settings[property] && 
                          JSON.stringify(settings[property]) === JSON.stringify(data);
            }

            this.#updateIndicator(indicator, verified ? 'green' : 'orange');
            return { 
                success: verified, 
                property, 
                status: verified ? 'success' : 'partial',
                label: `${property} settings`
            };
        } catch (err) {
            this.#updateIndicator(indicator, 'red');
            return {
                success: false,
                property,
                status: 'failed',
                error: err.message,
                label: `${property} settings`
            };
        }
    }

    async #handleObjectStore({ db, store, data, indicator }) {
        await this.#indexed.clearStorePromise(db, store);
        let succeeded = 0;

        for (const item of data) {
            try {
                await this.#indexed.putStorePromise(db, item, store);
                succeeded++;
            } catch (err) {
                console.error(`Failed to store item in ${store}:`, err);
            }
        }

        const status = succeeded === 0 ? 'failed' :
            succeeded === data.length ? 'success' : 'partial';

        this.#updateIndicator(indicator,
            status === 'success' ? 'green' :
                status === 'partial' ? 'orange' : 'red'
        );

        return { status, store, total: data.length, succeeded };
    }

    async #handleMaxIDs({ db, maxID, indicator }) {
        let succeeded = 0;

        for (const { id, keyPath, store } of maxID) {
            try {
                await this.#indexed.putStorePromise(db, { [keyPath]: id }, store);
                succeeded++;
            } catch (err) {
                console.error(`Failed to store maxID for ${store}:`, err);
            }
        }

        const status = succeeded === maxID.length ? 'success' :
            succeeded > 0 ? 'partial' : 'failed';

        this.#updateIndicator(indicator,
            status === 'success' ? 'green' :
                status === 'partial' ? 'orange' : 'red'
        );

        return { status, succeeded, total: maxID.length };
    }
}

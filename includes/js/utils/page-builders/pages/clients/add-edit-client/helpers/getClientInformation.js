import ManageClient from "../../../../../../classes/ManageClient.js";

export default async function getClientInformation({cID, primaryKey}) {
    try {
        const manageClient = new ManageClient();
        const clientInfo = await manageClient.getClientInfo({ primaryKey });

        if (!clientInfo) {
            throw new Error('Client information not found');
        }

        return {
            clientInfo,
            formData: {
                client_name: clientInfo.client_name || '',
                street: clientInfo.street || '',
                city: clientInfo.city || '',
                state: clientInfo.state || '',
                zip: clientInfo.zip || '',
                distance: clientInfo.distance || '',
                phone: clientInfo.phone || '',
                email: clientInfo.email || '',
                trim_cycle: clientInfo.trim_cycle || '',
                trim_date: clientInfo.trim_date || '',
                app_time: clientInfo.app_time || '',
                active: clientInfo.active || 'yes'
            }
        };
    } catch (err) {
        const { handleError } = await import("../../../../../../utils/error-messages/handleError.js");
        await handleError({
            filename: 'getClientInformationError',
            consoleMsg: 'Get client information error:',
            err,
            userMsg: 'Unable to get the clients information.',
            errorEle: 'page-msg'
        });
        throw err;
    }
}
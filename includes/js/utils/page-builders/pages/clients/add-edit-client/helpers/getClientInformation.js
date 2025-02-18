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
        const { default: errorLogs } = await import("../../../../../../utils/error-messages/errorLogs.js");
        await errorLogs('getClientInformationError', 'Get client information error:', err);
        throw err;
    }
}
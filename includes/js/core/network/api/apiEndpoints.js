// Group endpoints by feature
export const authAPI = {
    login: "/includes/api/login/loginAPI.php",
    register: "/includes/api/register-user/registerUserAPI.php",
    checkDuplicate: "/includes/api/duplicate-validation/checkForDuplicatesAPI.php",
    terms: "/includes/api/register-user/getTermsAPI.php",
};

export const systemAPI = {
    installApp: "/includes/api/home/getInstallAppAPI.php",
    notifications: "/includes/api/home/getNotificationsAPI.php",
    errorLog: "/includes/api/error-logs/errorLogAPI.php"
};

export const accountAPI = {
    unpaidInvoices: "/includes/api/my-account/unpaid-invoices/getUnpaidInvoicesAPI.php",
    subscription: "/includes/api/my-account/subsciptions/getSubscriptionAPI.php",
};

export const dataAPI = {
    backup: "/includes/api/dashboard/backup-data/backupDataAPI.php",
    transfer: "/includes/api/dashboard/transfer-data/transferDataAPI.php",
    receipt: "/includes/api/send-receipt/sendReceiptAPI.php"
};

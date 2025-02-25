import { logServerSideError } from "./errorLogger";

/**
 * Middleware for error logging
 * Formats error info and passes to server logger
 */
export async function errorLogs(filename, consoleMsg, error) {
    try {
        // Console logging
        console.error(consoleMsg, error);
        
        // Server logging
        await logServerSideError(filename, consoleMsg, error);
    }
    catch (loggingError) 
    {
        // Only console log if server logging fails
        console.error('Error logging failed:', loggingError);
    }
}

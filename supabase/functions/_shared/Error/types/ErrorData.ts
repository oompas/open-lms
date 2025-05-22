// Either a defined error type, or UNCAUGHT for non-defined (e.g. unexpected) errors
type ErrorType = 'VALIDATION' | 'PERMISSION' | 'LOGIC' | 'INPUT' | 'DATABASE' | 'UNCAUGHT';

/**
 * API returns this structure when an error in thrown
 */
type ErrorObject = {
    endpoint: string;
    request_uuid: string; // Not validated (UUIDs are randomly generated)
    type: ErrorType;
    request_user_id: string;
    payload: Record<string, any>;
    message: string;
    stack_trace: string; // Not validated (complex + we don't care about specific files/lines)
}

export default ErrorObject;

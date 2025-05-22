import { expect } from 'chai';

// Copying the error format from the API
type ErrorType = 'VALIDATION' | 'PERMISSION' | 'LOGIC' | 'INPUT' | 'DATABASE' | 'UNCAUGHT';
type ErrorObject = {
    endpoint: string;
    request_uuid: string; // Not validated here (UUIDs are randomly generated)
    type: ErrorType;
    request_user_id: string;
    payload: Record<string, any>;
    message: string;
    stack_trace: string; // Not validated here (complex + we don't care about specific files/lines where the error came from)
}

// Any combination of the parameters (excl. req uuid & trace) can be validated here
export type ValidationParams = {
    endpoint?: string;
    type?: ErrorType;
    request_user_id?: string;
    payload?: Record<string, any>;
    message?: string;
}

/**
 * Validates a returned error object against expected parameters
 *
 * @param errorObject The error object to validate
 * @param validationParams Parameter(s) to validate against
 * @returns True if validation passes, throws an error otherwise
 */
function validateError(errorObject: ErrorObject, validationParams: ValidationParams): boolean {

    // Check that validationParams has at least one property to validate
    const validationKeys = Object.keys(validationParams);
    if (validationKeys.length === 0) {
        throw new Error('Invalid validationParams: must contain at least one property to validate');
    }

    if (validationParams.endpoint !== undefined) {
        try {
            expect(errorObject.endpoint).to.equal(validationParams.endpoint);
        } catch (error) {
            throw new Error(`Endpoint validation failed: expected "${validationParams.endpoint}" but got "${errorObject.endpoint}"`);
        }
    }

    if (validationParams.type !== undefined) {
        const validErrorTypes: ErrorType[] = ['VALIDATION', 'PERMISSION', 'LOGIC', 'INPUT', 'DATABASE', 'UNCAUGHT'];

        // First check the type is valid, then verify it matches the expected value
        try {
            expect(validErrorTypes).to.include(errorObject.type);
        } catch (error) {
            throw new Error(`Type validation failed: "${errorObject.type}" is not a valid error type`);
        }

        try {
            expect(errorObject.type).to.equal(validationParams.type);
        } catch (error) {
            throw new Error(`Type validation failed: expected "${validationParams.type}" but got "${errorObject.type}"`);
        }
    }

    if (validationParams.request_user_id !== undefined) {
        try {
            expect(errorObject.request_user_id).to.equal(validationParams.request_user_id);
        } catch (error) {
            throw new Error(`Request user ID validation failed: expected "${validationParams.request_user_id}" but got "${errorObject.request_user_id}"`);
        }
    }

    if (validationParams.message !== undefined) {
        try {
            expect(errorObject.message).to.equal(validationParams.message);
        } catch (error) {
            throw new Error(`Message validation failed: expected "${validationParams.message}" but got "${errorObject.message}"`);
        }
    }

    if (validationParams.payload !== undefined) {
        try {
            expect(errorObject.payload).to.deep.equal(validationParams.payload);
        } catch (error) {
            throw new Error(`Payload validation failed: expected ${JSON.stringify(validationParams.payload)} but got ${JSON.stringify(errorObject.payload)}`);
        }
    }

    return true;
}

export { validateError };

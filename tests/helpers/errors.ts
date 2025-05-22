import { expect } from 'chai';

// Define the error types
type ErrorType = 'VALIDATION' | 'PERMISSION' | 'LOGIC' | 'INPUT' | 'DATABASE' | 'UNCAUGHT';

// Define the error object structure
interface ErrorObject {
    endpoint: string;
    request_uuid: string; // Not validated
    type: ErrorType;
    request_user_id: string;
    payload: Record<string, any>;
    message: string;
    stack_trace: string; // Not validated
}

// Define the validation parameters structure
interface ValidationParams {
    endpoint?: string;
    type?: ErrorType;
    request_user_id?: string;
    payload?: Record<string, any>;
    message?: string;
}

/**
 * Validates an error object against expected parameters
 * @param errorObject The error object to validate
 * @param validationParams Parameters to validate against
 * @returns True if validation passes, throws error otherwise
 */
function validateError(errorObject: ErrorObject, validationParams: ValidationParams): boolean {
    // Validate only the fields specified in the validation params
    if (validationParams.endpoint !== undefined) {
        try {
            expect(errorObject.endpoint).to.equal(validationParams.endpoint);
        } catch (error) {
            throw new Error(`Endpoint validation failed: expected "${validationParams.endpoint}" but got "${errorObject.endpoint}"`);
        }
    }

    if (validationParams.type !== undefined) {
        const validErrorTypes: ErrorType[] = ['VALIDATION', 'PERMISSION', 'LOGIC', 'INPUT', 'DATABASE', 'UNCAUGHT'];

        try {
            // Ensure the error's type is valid
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

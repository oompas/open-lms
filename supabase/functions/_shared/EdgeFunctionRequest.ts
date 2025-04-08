import { z, ZodError, ZodSchema } from "npm:zod@3.23.8";
import ValidationError from "./Error/ValidationError.ts";
import ApiError from "./Error/ApiError.ts";
import { adminClient } from "./adminClient.ts";
import PermissionError from "./Error/PermissionError.ts";

export interface RunParams {
    metaUrl: string;
    req: Request;
    schemaRecord: Record<string, z.ZodTypeAny>;
    endpointFunction: (request: EdgeFunctionRequest) => Promise<any>;
    adminOnly?: boolean;
    disableAuthCheck?: boolean;
}

class EdgeFunctionRequest {

    private readonly uuid: string;

    private readonly endpoint: string;
    private readonly req: Request;
    private readonly token: string;
    private readonly schemaRecord: Record<string, z.ZodTypeAny>;
    private payload: Record<string, any> | null = null;
    private requestUser: object | null = null;
    private isAdmin: boolean | null = null;

    private static readonly endpointRegex: RegExp = /^[a-z]+(-[a-z]+)+$/;

    /**
     * Runs an endpoint
     *
     * @param metaUrl Pass import.meta.url from the index file here - used to get the endpoint name from the path
     * @param req Request object from Deno
     * @param schemaRecord Record of fields this request should have
     * @param endpointFunction Function to run the business logic for this endpoint
     * @param adminOnly Throws an error if this endpoint can only be called by admins/developers
     * @param disableAuthCheck Doesn't verify requesting user if true (sets requestUser to null)
     */
    public static async run({ metaUrl, req, schemaRecord, endpointFunction, adminOnly, disableAuthCheck }: RunParams) {

        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        const request: EdgeFunctionRequest = new EdgeFunctionRequest(metaUrl, req, schemaRecord, token);

        try {
            if (req.method === 'OPTIONS') {
                return request.OptionsRsp();
            }

            await request.validateRequest(adminOnly ?? false, disableAuthCheck ?? false);

            const rsp = await endpointFunction(request);

            return request.SuccessResponse(rsp);
        } catch (err) {
            return await request.HandleEndpointError(err);
        }
    }

    /**
     * Creates a new instance, generating a UUID and storing the request & schema object
     *
     * @param req Request object from Deno
     * @param schemaRecord Record of fields this request should have
     * @param metaUrl Pass import.meta.url from the index file here - used to get the endpoint name from the path
     * @param token Requesting user's token (remove the "Bearer: " from it)
     */
    private constructor(metaUrl: string, req: Request, schemaRecord: Record<string, z.ZodTypeAny>, token: string | undefined) {
        this.uuid = crypto.randomUUID();

        const splitUrl: string[] = metaUrl.split("/");
        if (splitUrl.length < 2 || !EdgeFunctionRequest.endpointRegex.test(splitUrl[splitUrl.length - 2])) {
            throw new ApiError(`Invalid edge function url: ${JSON.stringify(splitUrl)}`);
        }

        this.endpoint = splitUrl[splitUrl.length - 2];
        this.req = req;
        this.token = token;
        this.schemaRecord = schemaRecord;
    }

    /**
     * Gets, stores and strictly validates the payload against the given schema, as well as getting the requesting user
     */
    public async validateRequest(adminOnly: boolean, disableAuthCheck: boolean): Promise<Record<string, any>> {

        const [payload, requestUser] = await Promise.all([
            this.req.json(),
            disableAuthCheck ? null : this.getUserFromReq()
        ]);

        this.payload = payload;
        this.requestUser = requestUser;
        this.isAdmin = requestUser?.user_metadata.role === "Admin" || requestUser?.user_metadata.role === "Developer";

        if (adminOnly && !this.isAdmin) {
            throw new PermissionError("Only administrators can call this endpoint");
        }

        // Validate payload
        try {
            const schema: ZodSchema = z.object(this.schemaRecord).strict();
            schema.parse(this.payload);
        } catch (error) {
            if (error instanceof ZodError) {
                this.logErr(`Incoming payload doesn't match schema: ${error.message}`, 'EdgeFunctionRequest.validateRequest');
                throw new ValidationError("Payload validation failed: " + error.errors.map(err => err.message).join(", "));
            }

            this.logErr(`Internal error validating payload: ${error.message}`, 'EdgeFunctionRequest.validatePayload');
            throw error;
        }
    }

    /**
     * Handles a caught error, logging it to the server console & database
     */
    private async HandleEndpointError(err: any): Promise<Response> {
        let errorType, statusCode, message;

        // Handle custom error types, then everything else
        if (err instanceof ApiError) {
            errorType = err.type;
            statusCode = err.statusCode;
            message = err.message;
        } else {
            errorType = "UNCAUGHT";
            statusCode = 500;
            message = `Uncaught internal error: ${err.message}`;
        }

        // Log error to database + server console
        const errObject = {
            endpoint: this.getEndpoint(),
            request_uuid: this.getUUID(),
            type: errorType,
            request_user_id: this.getRequestUserId(),
            payload: this.getPayload(),
            message: message,
            stack_trace: err.stack
        };

        const { error } = await adminClient.from('error_log').insert(errObject);
        if (error) {
            this.logErr(`Error logging error: ${JSON.stringify(error)}`, `HandleEndpointError`);
        }

        this.logErr(`Error caught: ${JSON.stringify(errObject)}`, `HandleEndpointError`);

        // Just return the uuid - don't expose internal data
        return this._makeResponse(this.getUUID(), statusCode);
    }

    /**
     * Throws an error if this user isn't an administrator
     * @param message Error message to throw
     */
    public validateAdmin = async (message: string) => {
        if (!this.isAdmin) {
            throw new PermissionError(message);
        }
    }

    /**
     * Get the user object from the edge function request
     * @returns The user object, or null if no user authorization in the request
     */
    private getUserFromReq = async (): Promise<object> => {
        const { data: { user }, error } = await adminClient.auth.getUser(this.token);

        if (error) {
            throw new Error(`Error getting user in getUserFromReq: ${error.message}`);
        }

        return user;
    }

    /**
     * Gets a user object that has the specific ID. Note this should only be done by admins
     * @param userId User ID of the user to get
     * @param adminCheck true to verify the requesting user is an admin before getting user
     */
    public getUserById = async (userId: string, adminCheck: boolean = true): Promise<object> => {

        if (adminCheck && !this.isAdmin) {
            throw new ApiError("Only admins can get specific users by id - this call shouldn't happen");
        }

        const { data, error } = await adminClient.auth.admin.getUserById(userId);

        if (error) {
            throw new ApiError(error.message);
        }

        return data.user;
    }

    /**
     * Gets all users on the app
     */
    public getAllUsers = async (): Promise<any[]> => {

        if (!this.isAdmin) {
            throw new ApiError("Only admins can get all users - this call shouldn't happen");
        }

        const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

        if (error) {
            throw ApiError(error.message);
        }

        return data.users;
    }

    // Helper for response construction
    private _makeResponse(data: any, status?: number) {
        const headers = {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
                "Content-Type": "application/json",
            },
            ...(status !== undefined && { status })
        };

        return new Response(JSON.stringify(data), headers);
    }

    // Responses for function invocations
    private OptionsRsp = () => this._makeResponse('ok');
    private SuccessResponse = (data: any) => this._makeResponse(data, 200);

    // Logs to Supabase's Edge Function logs
    public log = (message: string): void => console.log(`[${this.uuid}] ${message}`);
    public logErr = (message: string, functionName: string): void => console.error(`[${this.uuid}] (${functionName}) ${message}`);

    // Getters/setters
    public getPayload = (): Record<string, any> | null => this.payload;
    public getUUID = (): string => this.uuid;
    public getEndpoint = (): string => this.endpoint;
    public getRequestUser = (): object | null => this.requestUser;
    public getRequestUserId = (): string | null => this.requestUser?.id ?? null;
}

export default EdgeFunctionRequest;

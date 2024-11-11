import { z, ZodError, ZodSchema } from "npm:zod";
import ValidationError from "./Error/ValidationError.ts";
import { getRequestUser } from "./auth.ts";
import ApiError from "./Error/ApiError.ts";
import { adminClient } from "./adminClient.ts";

export interface RunParams {
    metaUrl: string;
    req: Request;
    schemaRecord: Record<string, z.ZodTypeAny>;
    endpointFunction: (request: EdgeFunctionRequest) => Promise<any>;
}

class EdgeFunctionRequest {

    private readonly uuid: string;

    private readonly endpoint: string;
    private readonly req: Request;
    private readonly schemaRecord: Record<string, z.ZodTypeAny>;
    private payload: Record<string, any> | null = null;
    private requestUser: object | null = null;

    /**
     * Runs an endpoint
     *
     * @param metaUrl Pass import.meta.url from the index file here - used to get the endpoint name from the path
     * @param req Request object from Deno
     * @param schemaRecord Record of fields this request should have
     * @param endpointFunction Function to run the business logic for this endpoint
     */
    public static async run({ metaUrl, req, schemaRecord, endpointFunction }: RunParams) {

        const request: EdgeFunctionRequest = new EdgeFunctionRequest(metaUrl, req, schemaRecord);

        try {
            if (req.method === 'OPTIONS') {
                return request.OptionsRsp();
            }

            await request.validateRequest();

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
     */
    private constructor(metaUrl: string, req: Request, schemaRecord: Record<string, z.ZodTypeAny>) {
        this.uuid = crypto.randomUUID();

        const splitUrl = metaUrl.split("/");
        this.endpoint = splitUrl[splitUrl.length - 2];
        this.req = req;
        this.schemaRecord = schemaRecord;
    }

    /**
     * Gets, stores and strictly validates the payload against the given schema, as well as getting the requesting user
     */
    public async validateRequest(): Promise<Record<string, any>> {

        const [payload, requestUser] = await Promise.all([
            this.req.json(),
            getRequestUser(this.req)
        ]);

        this.payload = payload;
        this.requestUser = requestUser;

        try {
            const schema: ZodSchema = z.object(this.schemaRecord).strict();
            schema.parse(this.payload);
        } catch (error) {
            if (error instanceof ZodError) {
                this.logErr(`Incoming payload doesn't match schema: ${error.message}`, 'EdgeFunctionRequest.validatePayload');
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
        return _makeResponse(this.getUUID(), statusCode);
    }

    // Helper for response construction
    private _makeResponse = (data: any, status?: number) => {
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

    /**
     * All endpoints must check if (req.method === 'OPTIONS') then return this response at the start of their execution
     */
    private OptionsRsp = () => this._makeResponse('ok');

    /**
     * Constructions a response for a successful function invocation
     */
    private SuccessResponse = (data: any) => this._makeResponse(data, 200);

    public log = (message: string): void => {
        console.log(`[${this.uuid}] ${message}`);
    }

    public logErr = (message: string, functionName: string): void => {
        console.error(`[${this.uuid}] (${functionName}) ${message}`);
    }

    // Getters/setters
    public getPayload = (): Record<string, any> | null => this.payload;
    public getUUID = (): string => this.uuid;
    public getEndpoint = (): string => this.endpoint;
    public getRequestUser = (): object | null => this.requestUser;
    public getRequestUserId = (): object | null => this.requestUser?.id ?? null;
}

export default EdgeFunctionRequest;

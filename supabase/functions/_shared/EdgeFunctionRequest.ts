import { z, ZodError, ZodSchema } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import ValidationError from "./Error/ValidationError.ts";
import { getRequestUser } from "./auth.ts";

class EdgeFunctionRequest {

    private readonly uuid: string;

    private readonly endpoint: string;
    private readonly req: Request;
    private readonly schemaRecord: ZodSchema;
    private payload: Record<string, any> | null = null;
    private requestUser: object | null = null;

    /**
     * Creates a new instance, generating a UUID and storing the request & schema object
     *
     * @param req Request object from Deno
     * @param schemaRecord Record of fields this request should have
     * @param metaUrl Pass import.meta.url from the index file here - used to get the endpoint name from the path
     */
    public constructor(req: Request, schemaRecord: Record<string, z.ZodTypeAny>, metaUrl: string) {
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

    public log = (message: string) => {
        console.log(`[${this.uuid}] ${message}`);
    }

    public logErr = (message: string, functionName: string) => {
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

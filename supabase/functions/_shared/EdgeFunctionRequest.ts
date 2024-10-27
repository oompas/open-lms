import { z, ZodError, ZodSchema } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import ValidationError from "./Error/ValidationError.ts";

class EdgeFunctionRequest {

    private readonly uuid: string;

    private readonly req: Request;
    private readonly schemaRecord: ZodSchema;
    private payload: Record<string, any> | null = null;

    private response: Response | null = null;
    private error: Error | null = null;

    /**
     * Creates a new instance, generating a UUID and storing the request & schema object
     *
     * @param req Request object from Deno
     * @param schemaRecord Record of fields this request should have
     */
    public constructor(req: Request, schemaRecord: Record<string, z.ZodTypeAny>) {
        this.uuid = crypto.randomUUID();
        this.req = req;
        this.schemaRecord = schemaRecord;
    }

    /**
     * Gets, stores and strictly validates the payload against the given schema
     */
    public async validatePayload(): Promise<Record<string, any>> {
        try {
            const schema: ZodSchema = z.object(this.schemaRecord).strict();

            this.payload = await this.req.json();
            schema.parse(this.payload);
        } catch (error) {
            if (error instanceof ZodError) {
                this.logErr(`Incoming payload doesn't match schema: ${error.message}`);
                throw new ValidationError("Payload validation failed: " + error.errors.map(err => err.message).join(", "));
            }

            this.logErr(`Internal error validating payload: ${error.message}`);
            throw error;
        }
    }

    public logErr = (message: string) => console.error(message);

    // Getters
    public getReq(): Request {
        return this.req;
    }

    public getPayload(): Record<string, any> | null {
        return this.payload;
    }

    public getUuid(): string | null {
        return this.uuid;
    }

    public getResponse(): Response | null {
        return this.response;
    }

    public getError(): Error | null {
        return this.error;
    }

    // Setters
    public setResponse(response: Response): void {
        this.response = response;
    }
}

export default EdgeFunctionRequest;

import { z, ZodError, ZodSchema } from "https://deno.land/x/zod@v3.16.1/mod.ts";
import ValidationError from "./Error/ValidationError.ts";

class EdgeFunctionRequest {

    private readonly uuid: string;

    private readonly req: Request;
    private readonly schema: ZodSchema;
    private payload: Record<string, any> | null = null;

    private response: Response | null = null;
    private error: Error | null = null;

    /**
     * Creates and returns a new instance of an EdgeFunctionRequest
     * @param req Request object
     * @param schemaObject Schema to validate the payload with
     */
    public static async create(req: Request, schemaObject: Record<string, z.ZodTypeAny>) {
        const schema: ZodSchema = z.object(schemaObject).strict();

        const instance = new EdgeFunctionRequest(req, schema);
        await instance.validatePayload();

        return instance;
    }

    private constructor(req: Request, schema: ZodSchema) {
        try {
            this.uuid = crypto.randomUUID();
        } catch (error) {
            console.error(`UUID generation failed in EdgeFunctionRequest: ${error.message}`);
            throw error;
        }

        this.req = req;
        this.schema = schema;
    }

    // Gets payload and ensures its following the desired schema
    private async validatePayload(): Promise<Record<string, any>> {
        try {
            console.log("before both");
            this.payload = await this.req.json();
            console.log(`middle. schema: ${JSON.stringify(this.schema)} payload: ${JSON.stringify(this.payload)}`);
            this.schema.parse(this.payload);
            console.log("after");
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

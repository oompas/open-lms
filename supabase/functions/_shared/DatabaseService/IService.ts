import { adminClient } from "../adminClient.ts";
import DatabaseError from "../Error/DatabaseError.ts";

class IService {

    protected abstract readonly TABLE_NAME: string;

    protected constructor() {}

    protected async getAllRows(): Promise<any> {
        try {
            const data = await adminClient.from(this.TABLE_NAME).select();
            if (rsp.error) {
                throw rsp.error;
            }
            return rsp.data;
        } catch (error) {
            DatabaseError.create();
        }
    }
}

export default IService;

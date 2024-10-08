import { adminClient } from "../adminClient.ts";

class IService {

    protected abstract readonly TABLE_NAME: string;

    protected constructor() {}

    protected getAllRows(): Promise<any> {
        return adminClient.from(this.TABLE_NAME).select()
            .then((rsp) => {
                if (rsp.error) {
                    throw new Error(`Error querying all data in ${TABLE_NAME}: ${rsp.error}`);
                }
                return rsp.data;
            });
    }
}

export default IService;

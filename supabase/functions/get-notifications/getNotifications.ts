import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { getRows } from "../_shared/database.ts";

const getNotifications = async (request: EdgeFunctionRequest) => {

    const userId = request.getRequestUserId();

    const notifications = await getRows({ table: 'notification', conditions: ['eq', 'user_id', userId] });
    if (notifications instanceof Response) return notifications;

    return notifications;
}

export default getNotifications;

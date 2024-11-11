import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";

const readNotification = async (request: EdgeFunctionRequest): Promise<Response> => {

    const { notificationId } = await request.payload;

    const userId = await request.getRequestUserId();
    const query = adminClient.from('notification').update({ read: true }).eq('user_id', userId);
    if (notificationId) {
        query.eq('id', notificationId);
    }
    await query;

    return null;
}

export default readNotification;

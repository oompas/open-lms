import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";
import { SuccessResponse, OptionsRsp } from "../_shared/helpers.ts";

const readNotification = async (request: EdgeFunctionRequest): Promise<Response> => {
    const req = request.req;

    if (req.method === 'OPTIONS') {
        return OptionsRsp();
    }

    const { notificationId, readAll } = await request.req.json();

    const userId = await request.getRequestUserId();
    const query = adminClient.from('notification').update({ read: true }).eq('user_id', userId);
    if (!readAll) {
        query.eq('id', notificationId);
    }
    await query;

    return SuccessResponse(null);
}

export default readNotification;

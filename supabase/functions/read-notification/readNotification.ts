import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { adminClient } from "../_shared/adminClient.ts";
import ApiError from "../_shared/Error/types/ApiError.ts";

const readNotification = async (request: EdgeFunctionRequest): Promise<Response> => {

    const { notificationId } = request.getPayload();
    const userId = request.getRequestUserId();

    request.log(`Entering readNotification for user ${userId} with notificationId ${notificationId}`);

    const query = adminClient.from('notification').update({ read: true }).eq('user_id', userId); // TODO: Extract to service
    if (notificationId) {
        query.eq('id', notificationId);
    }
    const { data, error } = await query;

    if (error) {
        throw error;
    }
    if (!data) {
        throw ApiError(`No notifications updated`);
    }

    request.log(`Successfully read ${data.length} notifications`);

    return null;
}

export default readNotification;

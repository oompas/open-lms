import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { NotificationService } from "../_shared/Service/Services.ts";

const getNotifications = async (request: EdgeFunctionRequest): Promise<object[]> => {

    const userId = request.getRequestUserId();

    request.log(`Entering getNotifications with user ID ${userId}`);

    const notifications = await NotificationService.query('*', ['eq', 'user_id', userId]);

    request.log(`Queried ${notifications.length} notifications`);

    return notifications;
}

export default getNotifications;

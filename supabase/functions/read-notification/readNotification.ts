import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { NotificationService } from "../_shared/Service/Services.ts";

const readNotification = async (request: EdgeFunctionRequest): Promise<Response> => {

    const { notificationId } = request.getPayload();
    const userId = request.getRequestUserId();

    request.log(`Entering readNotification for user ${userId} with notificationId ${notificationId}`);

    if (notificationId) {
        await NotificationService.readNotification(userId, notificationId);

        request.log(`Successfully read notification`);
    } else {
        const numRead: number = await NotificationService.readAllNotifications(userId);

        request.log(`Successfully read ${numRead} notifications`);
    }

    return null;
}

export default readNotification;

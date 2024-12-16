import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import DatabaseError from "../../Error/DatabaseError.ts";

type NotificationData = {
    user_id: string,
    direct: boolean,
    title: string,
    link: string
}

class _notificationService extends IService {

    TABLE_NAME = "notification";

    /**
     * Adds a new notification to the database
     */
    public async addNotification(notification: NotificationData) {
        const { error } = await adminClient.from(this.TABLE_NAME).insert(notification);

        if (error) {
            throw new DatabaseError(`Error adding notification: ${error.message}`);
        }
    }
}

export default _notificationService;

import IService from "../IService.ts";
import { adminClient } from "../../adminClient.ts";
import DatabaseError from "../../Error/DatabaseError.ts";
import ApiError from "../../Error/types/ApiError.ts";
import InputError from "../../Error/InputError.ts";

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
    public async addNotification(notification: NotificationData): Promise<void> {
        const { error } = await adminClient.from(this.TABLE_NAME).insert(notification);

        if (error) {
            throw new DatabaseError(`Error adding notification: ${error.message}`);
        }
    }

    /**
     * Reads a specific notification
     */
    public async readNotification(): Promise<void> {
        const { data, error } = await adminClient.from(this.TABLE_NAME)
            .update({ read: true })
            .eq('user_id', userId)
            .eq('id', notificationId);

        if (error) {
            throw error;
        }
        if (!data) {
            throw new InputError(`No notifications updated - check userId or notificationId`);
        }
    }

    /**
     * Reads all notifications a user has
     *
     * @return The number of notifications updated
     */
    public async readAllNotifications(): Promise<number> {
        const { data, error } = await adminClient.from(this.TABLE_NAME)
            .update({ read: true })
            .eq('user_id', userId);

        if (error) {
            throw error;
        }
        if (!data) {
            throw new ApiError(`No notifications updated - check userId`);
        }

        return data.length;
    }
}

export default _notificationService;

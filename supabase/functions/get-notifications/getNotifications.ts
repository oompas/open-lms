import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import { NotificationService } from "../_shared/Service/Services.ts";

const getNotifications = async (request: EdgeFunctionRequest): Promise<object[]> => {

    const userId = request.getRequestUserId();

    return await NotificationService.query('*', ['eq', 'user_id', userId]);
}

export default getNotifications;

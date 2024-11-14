import IService from "../IService.ts";

class _notificationService extends IService {

    private static readonly TABLE_NAME = "notification";

    public constructor() {
        super(_notificationService.TABLE_NAME);
    }
}

export default _notificationService;

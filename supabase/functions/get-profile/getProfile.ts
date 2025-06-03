import EdgeFunctionRequest from "../_shared/EdgeFunctionRequest.ts";
import getCurrentUserProfile from "./getCurrentUserProfile.ts";
import getOtherUserProfile from "./getOtherUserProfile.ts";

const getProfile = async (request: EdgeFunctionRequest): Promise<object> => {

    const { userId } = request.getPayload();

    if (!userId) {
        return await getCurrentUserProfile(request);
    }

    return await getOtherUserProfile(request);
}

export default getProfile;

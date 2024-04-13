import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

interface CourseAttemptDocument {
    id?: string;
    userId: string;
    courseId: string;
    startTime: firestore.Timestamp;
    endTime: firestore.Timestamp | null;
    pass: boolean | null;
}

class CourseAttempt extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    public readonly userId: string;
    public readonly courseId: string;
    public readonly startTime: firestore.Timestamp;
    public readonly endTime: firestore.Timestamp | null;
    public readonly pass: boolean | null;

    constructor(attempt: CourseAttemptDocument) {
        super(attempt.id);

        this.userId = attempt.userId;
        this.courseId = attempt.courseId;
        this.startTime = attempt.startTime;
        this.endTime = attempt.endTime;
        this.pass = attempt.pass;
    }

    public getObject(noId?: boolean): CourseAttemptDocument {
        return {
            ...(!noId && { id: this.getId() }),
            userId: this.userId,
            courseId: this.courseId,
            startTime: this.startTime,
            endTime: this.endTime,
            pass: this.pass
        };
    }

    public static fromFirestore(doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): CourseAttempt {
        const attempt: CourseAttemptDocument = {
            id: doc.id,
            userId: doc.get("userId"),
            courseId: doc.get("courseId"),
            startTime: doc.get("startTime"),
            endTime: doc.get("endTime"),
            pass: doc.get("pass")
        };
        return new CourseAttempt(attempt);
    }

    public static getDocumentById = (id: string): Promise<CourseAttempt> => super._getDocumentById(this.collection, id).then(doc => this.fromFirestore(doc));

    public static getAllDocs = () => super._getAllDocs(this.collection).then((docs) => docs.map((doc) => this.fromFirestore(doc)));

    public static delete = (docId: string) => super._delete(this.collection, docId);


    /**
     * Gets the latest course attempt for a user & course, returning null if no current attempt
     */
    public static getLatestCourseAttempt = async (courseId: string, userId: string): Promise<CourseAttempt | null> => {

        super.validDocumentId(courseId);
        super.validUserId(userId);

        return this.collection
            .where("courseId", "==", courseId)
            .where("userId", "==", userId)
            .orderBy("startTime", "desc")
            .limit(1)
            .get()
            .then((docs) => {
                if (docs.empty) {
                    return null;
                }
                return CourseAttempt.fromFirestore(docs.docs[0]);
            })
            .catch((error) => {
                logger.error(`Error getting latest course attempt for user '${userId}' and course '${courseId}': ${error}`);
                throw new HttpsError('internal', `Error getting latest course attempt for user '${userId}' and course '${courseId}`);
            });
    }
}

export default CourseAttempt;

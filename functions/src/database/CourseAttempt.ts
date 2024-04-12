import { DatabaseObject } from "./DatabseObject";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "../helpers/setup";
import { firestore } from "firebase-admin";

class CourseAttempt extends DatabaseObject {

    private readonly userId: string;
    private readonly courseId: string;
    private readonly startTime: firestore.Timestamp;
    private endTime: firestore.Timestamp | null;
    private readonly pass: boolean | null;

    constructor(id: string, userId: string, courseId: string, startTime: firestore.Timestamp, endTime: firestore.Timestamp | null, pass: boolean | null) {
        super(id);

        this.userId = userId;
        this.courseId = courseId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pass = pass;
    }

    public getUserId = (): string => this.userId;
    public getCourseId = (): string => this.courseId;
    public getStartTime = (): number => this.startTime.seconds;
    public getEndTime = (): number | null => this.endTime?.seconds ?? null;
    public getPass = (): boolean | null => this.pass;

    public static collection = () => db.collection(this.constructor.name);

    public getObject(): { id: string; userId: string; courseId: string; startTime: number; endTime: number | null; pass: boolean | null } {
        return {
            id: this.getId(),
            userId: this.userId,
            courseId: this.courseId,
            startTime: this.startTime.seconds,
            endTime: this.endTime?.seconds ?? null,
            pass: this.pass
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): CourseAttempt => {
        const data = doc.data();
        return new CourseAttempt(doc.id, data.userId, data.courseId, data.startTime, data.endTime, data.pass);
    }

    public static getAllDocs = (): Promise<CourseAttempt[]> => {
        const collectionName = this.constructor.name;
        return db.collection(collectionName)
            .get()
            .then((result) => result.docs.map(doc => CourseAttempt.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }
}

export default CourseAttempt;

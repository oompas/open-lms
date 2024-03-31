import { DatabaseObject } from "./DatabseObject";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { db } from "../setup";
import { firestore } from "firebase-admin";

class CourseAttempt extends DatabaseObject {

    private static CollectionName: string = "CourseAttempt";

    private readonly userId: string;
    private readonly courseId: string;
    private readonly startTime: firestore.Timestamp;
    private endTime: firestore.Timestamp | null;
    private pass: boolean | null;

    constructor(id: string, userId: string, courseId: string, startTime: firestore.Timestamp, endTime: firestore.Timestamp | null, pass: boolean | null) {
        super(id);

        this.userId = userId;
        this.courseId = courseId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pass = pass;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getCourseId(): string {
        return this.courseId;
    }

    public getStartTime(): number {
        return this.startTime.seconds;
    }

    public getEndTime(): number | null {
        return this.endTime?.seconds ?? null;
    }

    public getPass(): boolean | null {
        return this.pass;
    }

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
        return db.collection(CourseAttempt.CollectionName)
            .get()
            .then((result) => result.docs.map(doc => CourseAttempt.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${CourseAttempt.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${CourseAttempt.CollectionName}'`);
            });
    }
}

export default CourseAttempt;

import { firestore } from "firebase-admin";
import { DatabaseObject } from "./DatabseObject";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../setup";

class EnrolledCourse extends DatabaseObject {

    private static CollectionName: string = "EnrolledCourse";

    private readonly courseId: string;
    private readonly userId: string;
    private readonly enrolledDate: firestore.Timestamp;

    constructor(id: string, userId: string, courseId: string, enrolledDate: firestore.Timestamp) {
        super(id);

        this.courseId = courseId;
        this.userId = userId;
        this.enrolledDate = enrolledDate;
    }

    public getCourseId(): string {
        return this.courseId;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getEnrolledDate(): number {
        return this.enrolledDate.seconds;
    }

    public getObject(): { id: string; userId: string; courseId: string; enrolledDate: number } {
        return {
            id: this.getId(),
            userId: this.userId,
            courseId: this.courseId,
            enrolledDate: this.enrolledDate.seconds
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): EnrolledCourse => {
        const data = doc.data();
        return new EnrolledCourse(doc.id, data.userId, data.courseId, data.enrolledDate);
    }

    public static getAllDocs = (): Promise<EnrolledCourse[]> => {
        return db.collection(EnrolledCourse.CollectionName)
            .get()
            .then((result) => result.docs.map(doc => EnrolledCourse.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${EnrolledCourse.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${EnrolledCourse.CollectionName}'`);
            });
    }
}

export default EnrolledCourse;

import { firestore } from "firebase-admin";
import { DatabaseObject } from "./DatabseObject";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../setup";

class EnrolledCourse extends DatabaseObject {

    private static CollectionName: string = "EnrolledCourse";

    userId: string;
    courseId: string;
    enrolledDate: firestore.Timestamp;

    constructor(id: string, userId: string, courseId: string, enrolledDate: firestore.Timestamp) {
        super(id);
        this.userId = userId;
        this.courseId = courseId;
        this.enrolledDate = enrolledDate;
    }

    public getObject(): object {
        return {
            id: this.id,
            userId: this.userId,
            courseId: this.courseId,
            enrolledDate: this.enrolledDate.seconds
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): EnrolledCourse => {
        const data = doc.data();
        return new EnrolledCourse(doc.id, data.userId, data.courseId, data.enrolledDate);
    }

    static getAllDocs = (): Promise<EnrolledCourse[]> => {
        return db.collection(EnrolledCourse.CollectionName)
            .get()
            .then((result) => result.docs.map(doc => EnrolledCourse.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${EnrolledCourse.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${EnrolledCourse.CollectionName}'`);
            });
    }
}

export { EnrolledCourse };

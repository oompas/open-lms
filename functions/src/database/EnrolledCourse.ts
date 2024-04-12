import { firestore } from "firebase-admin";
import { DatabaseObject } from "./DatabseObject";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../helpers/setup";

class EnrolledCourse extends DatabaseObject {

    private readonly courseId: string;
    private readonly userId: string;
    private readonly enrolledDate: firestore.Timestamp;

    constructor(id: string, userId: string, courseId: string, enrolledDate: firestore.Timestamp) {
        super(id);

        this.courseId = courseId;
        this.userId = userId;
        this.enrolledDate = enrolledDate;
    }

    public getCourseId = (): string => this.courseId;
    public getUserId = (): string => this.userId;
    public getEnrolledDate = (): number => this.enrolledDate.seconds;

    public static collection = () => db.collection(this.constructor.name);

    public getObject(): { id: string; userId: string; courseId: string; enrolledDate: number } {
        return {
            id: this.getId(),
            userId: this.userId,
            courseId: this.courseId,
            enrolledDate: this.enrolledDate.seconds
        };
    }

    public static fromFirestoreDoc = (doc: firestore.QueryDocumentSnapshot): EnrolledCourse => {
        const data = doc.data();
        return new EnrolledCourse(doc.id, data.userId, data.courseId, data.enrolledDate);
    }

    public static fromFirestoreId = (id: string): Promise<EnrolledCourse> => {
        return EnrolledCourse.collection()
            .doc(id)
            .get()
            .then(doc => {
                if (!doc.exists || doc.data() === undefined) {
                    logger.error(`Document with id '${id}' not found in collection '${this.constructor.name}'`);
                    throw new HttpsError("not-found", `Document with id '${id}' not found in collection '${this.constructor.name}'`);
                }
                const data = doc.data(); // @ts-ignore
                return new EnrolledCourse(doc.id, data.userId, data.courseId, data.enrolledDate);
            })
            .catch(err => {
                logger.error(`Error getting document with id '${id}' from collection '${this.constructor.name}': ${err}`);
                throw new HttpsError("internal", `Error getting document with id '${id}' from collection '${this.constructor.name}'`);
            });
    }

    public static getAllDocs = (): Promise<EnrolledCourse[]> => {
        const collectionName = this.constructor.name;
        return EnrolledCourse.collection()
            .get()
            .then((result) => result.docs.map(doc => EnrolledCourse.fromFirestoreDoc(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }
}

export default EnrolledCourse;

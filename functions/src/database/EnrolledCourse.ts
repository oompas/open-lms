import { firestore } from "firebase-admin";
import { DatabaseObject } from "./DatabseObject";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../helpers/setup";

class EnrolledCourse extends DatabaseObject {

    private readonly courseId: string;
    private readonly userId: string;
    private readonly enrollmentTime: firestore.Timestamp;

    constructor(enrolledCourse: { id?: string, userId: string, courseId: string, enrollmentTime: firestore.Timestamp }) {
        super(enrolledCourse.id);

        this.courseId = enrolledCourse.courseId;
        this.userId = enrolledCourse.userId;
        this.enrollmentTime = enrolledCourse.enrollmentTime;
    }

    public static collection = () => db.collection(this.constructor.name);

    public getObject(noId?: boolean): { id?: string; userId: string; courseId: string; enrollmentTime: number } {
        return {
            ...(!noId && { id: this.getId() }),
            userId: this.userId,
            courseId: this.courseId,
            enrollmentTime: this.enrollmentTime.seconds
        };
    }

    public static fromFirestoreDoc = (doc: firestore.QueryDocumentSnapshot): EnrolledCourse => {
        const data = doc.data();
        const enrolledCourse = {
            id: doc.id,
            userId: data.userId,
            courseId: data.courseId,
            enrollmentTime: data.enrollmentTime
        };
        return new EnrolledCourse(enrolledCourse);
    }

    public static fromFirestoreId = (id: string): Promise<EnrolledCourse> => {
        return EnrolledCourse.collection()
            .doc(id)
            .get()
            .then(doc => {
                if (!doc.exists) {
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

    /**
     * Gets the enrollment id (document ID in firestore for an enrollment) ofr a given user and course
     */
    public static enrollmentId(userId: string, courseId: string): string {
        return `${userId}|${courseId}`;
    }

    /**
     * Returns a boolean representing if an enrollment exists
     */
    public static enrollmentExists(): boolean {
        return true;
    }
}

export default EnrolledCourse;

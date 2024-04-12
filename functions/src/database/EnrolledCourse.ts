import { firestore } from "firebase-admin";
import { DatabaseObject } from "./DatabseObject";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

interface EnrolledCourseDocument {
    id?: string;
    userId: string;
    courseId: string;
    enrollmentTime: firestore.Timestamp;
}

class EnrolledCourse extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    readonly courseId: string;
    readonly userId: string;
    private readonly enrollmentTime: firestore.Timestamp;

    constructor(enrolledCourse: EnrolledCourseDocument) {
        super(enrolledCourse.id);

        this.courseId = enrolledCourse.courseId;
        this.userId = enrolledCourse.userId;
        this.enrollmentTime = enrolledCourse.enrollmentTime;
    }

    public getObject(noId?: boolean): EnrolledCourseDocument {
        return {
            ...(!noId && { id: this.getId() }),
            userId: this.userId,
            courseId: this.courseId,
            enrollmentTime: this.enrollmentTime
        };
    }

    private static fromFirestore(doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): EnrolledCourse {
        const enrolledCourse: EnrolledCourseDocument = {
            id: doc.id,
            userId: doc.get("userId"),
            courseId: doc.get("courseId"),
            enrollmentTime: doc.get("enrollmentTime"),
        };
        return new EnrolledCourse(enrolledCourse);
    }

    public static getDocumentById = (id: string): Promise<EnrolledCourse> => super._getDocumentById(this.collection, id).then(doc => this.fromFirestore(doc));

    public static getAllDocs = () => super._getAllDocs(this.collection).then((docs) => docs.map((doc) => this.fromFirestore(doc)));

    public static delete = (docId: string) => super._delete(this.collection, docId);

    /**
     * Gets the enrollment id (document ID in firestore for an enrollment) ofr a given user and course
     */
    public static enrollmentId(userId: string, courseId: string): string {
        return `${userId}|${courseId}`;
    }

    /**
     * Returns a boolean representing if an enrollment exists
     */
    public static enrollmentExists(userId: string, courseId: string): Promise<boolean> {
        const enrollmentId = EnrolledCourse.enrollmentId(userId, courseId);

        return this.collection
            .doc(EnrolledCourse.enrollmentId(userId, courseId))
            .get()
            .then((doc) => doc.exists)
            .catch((err) => {
                logger.error(`Error checking if enrollment '${enrollmentId}' exists: ${err}`);
                throw new HttpsError("internal", `Error checking if enrollment '${enrollmentId}' exists`);
            });
    }
}

export default EnrolledCourse;

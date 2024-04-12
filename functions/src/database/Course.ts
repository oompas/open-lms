import { firestore } from "firebase-admin";
import { DatabaseObject } from "./DatabseObject";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/v2/providers/https";
import { db } from "../helpers/setup";

class Course extends DatabaseObject {

    public readonly name: string;
    public readonly description: string;
    public readonly link: string;
    public readonly active: boolean;
    public readonly minTime: number | null;
    public readonly userId: string;
    public readonly quiz: {
        maxAttempts: number | null;
        minScore: number | null;
        preserveOrder: boolean;
        timeLimit: number | null;
        totalMarks: number;
    } | null;
    public readonly creationTime: firestore.Timestamp;
    public readonly retired?: firestore.Timestamp;
    public readonly version: number;

    constructor(course: { id?: string, name: string, description: string, link: string, active: boolean, minTime: number | null, userId: string, quiz: {
        maxAttempts: number | null;
        minScore: number | null;
        preserveOrder: boolean;
        timeLimit: number | null;
        totalMarks: number;
    } | null, creationTime: firestore.Timestamp, version: number, retired?: firestore.Timestamp }) {
        super(course.id);

        this.name = course.name;
        this.description = course.description;
        this.link = course.link;
        this.active = course.active;
        this.minTime = course.minTime;
        this.userId = course.userId;
        this.quiz = Object.freeze(course.quiz);
        this.creationTime = course.creationTime;
        this.retired = course.retired;
        this.version = course.version;
    }

    public static collection = () => db.collection(this.constructor.name);

    public getObject(noId?: boolean): {
        id?: string;
        name: string;
        description: string;
        link: string;
        active: boolean;
        minTime: number | null;
        userId: string;
        quiz: {
            maxAttempts: number | null; minScore: number | null; preserveOrder: boolean; timeLimit
                : number | null; totalMarks: number;
        } | null;
        creationTime: number;
        retired?: number;
        version: number
    } {
        return {
            ...(!noId && { id: this.getId() }),
            name: this.name,
            description: this.description,
            link: this.link,
            active: this.active,
            minTime: this.minTime,
            userId: this.userId,
            quiz: this.quiz,
            creationTime: this.creationTime.seconds,
            retired: this.retired?.seconds,
            version: this.version
        };
    }

    public static fromFirestoreDoc = (doc: firestore.QueryDocumentSnapshot): Course => {
        const data = doc.data();
        const course = {
            id: doc.id,
            name: data.name,
            description: data.description,

        };
        return new Course(course);
    }

    public static fromFirestoreId = (id: string): Promise<Course> => {
        return Course.collection()
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


    public static getAllDocs = () => this._getAllDocs().then((docs) => docs.map((doc) => Course.fromFirestoreDoc(doc)));


    /**
     * Retires this course (if this course is updated, this version is retired)
     */
    public retire() {
        return this.updateFirestore({ retired: firestore.Timestamp.now() });
    }

    /**
     * Flips the visibility of the course
     */
    public updateVisibility() {
        return this.updateFirestore({ active: !this.active });
    }
}

export default Course;

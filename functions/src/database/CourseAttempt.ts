import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";

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

    private readonly userId: string;
    private readonly courseId: string;
    private readonly startTime: firestore.Timestamp;
    private readonly endTime: firestore.Timestamp | null;
    private readonly pass: boolean | null;

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
}

export default CourseAttempt;

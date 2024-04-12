import { firestore } from "firebase-admin";
import { DatabaseObject } from "./DatabseObject";

interface CourseDocument {
    id?: string;
    name: string;
    description: string;
    link: string;
    active: boolean;
    minTime: number | null;
    userId: string;
    quiz: {
        maxAttempts: number | null;
        minScore: number;
        preserveOrder: boolean;
        timeLimit: number | null;
        totalMarks: number;
    } | null;
    creationTime: firestore.Timestamp;
    retired?: firestore.Timestamp;
    version: number;
}

class Course extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    public readonly name: string;
    public readonly description: string;
    public readonly link: string;
    public readonly active: boolean;
    public readonly minTime: number | null;
    public readonly userId: string;
    public readonly quiz: {
        maxAttempts: number | null;
        minScore: number;
        preserveOrder: boolean;
        timeLimit: number | null;
        totalMarks: number;
    } | null;
    public readonly creationTime: firestore.Timestamp;
    public readonly retired?: firestore.Timestamp;
    public readonly version: number;

    constructor(course: CourseDocument) {
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

    public getObject(noId?: boolean): CourseDocument {
        return {
            ...(!noId && { id: this.getId() }),
            name: this.name,
            description: this.description,
            link: this.link,
            active: this.active,
            minTime: this.minTime,
            userId: this.userId,
            quiz: this.quiz,
            creationTime: this.creationTime,
            ...(this.retired && { retired: this.retired }),
            version: this.version
        };
    }

    private static fromFirestore(doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): Course {
        const course: CourseDocument = {
            id: doc.id,
            name: doc.get("name"),
            description: doc.get("description"),
            link: doc.get("link"),
            active: doc.get("active"),
            minTime: doc.get("minTime"),
            userId: doc.get("userId"),
            quiz: doc.get("quiz"),
            creationTime: doc.get("creationTime"),
            retired: doc.get("retired"),
            version: doc.get("version"),
        };
        return new Course(course);
    }

    public static getDocumentById = (id: string): Promise<Course> => super._getDocumentById(this.collection, id).then(doc => this.fromFirestore(doc));

    public static getAllDocs = () => super._getAllDocs(this.collection).then((docs) => docs.map((doc) => this.fromFirestore(doc)));

    public static delete = (docId: string) => super._delete(this.collection, docId);

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

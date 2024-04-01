import { logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from "firebase-admin";
import { db } from "../setup";
import { DatabaseObject } from "./DatabseObject";
import { string } from "yup";

class Course extends DatabaseObject {

    private static readonly CollectionName: string = "Course";

    private readonly name: string;
    private readonly description: string;
    private readonly link: string;
    private readonly active: boolean;
    private readonly minTime: number | null;
    private readonly userId: string;
    private readonly quiz: {
        maxAttempts: number | null;
        minScore: number | null;
        preserveOrder: boolean;
        timeLimit: number | null;
        totalMarks: number;
    } | null;
    private readonly creationTime: firestore.Timestamp;
    private readonly retired?: firestore.Timestamp;
    private readonly version: number;

    constructor(id: string, name: string, description: string, link: string, active: boolean, minTime: number | null, userId: string, quiz: {
        maxAttempts: number | null;
        minScore: number | null;
        preserveOrder: boolean;
        timeLimit: number | null;
        totalMarks: number;
    } | null, creationTime: firestore.Timestamp, version: number, retired?: firestore.Timestamp) {
        super(id);

        this.name = name;
        this.description = description;
        this.link = link;
        this.active = active;
        this.minTime = minTime;
        this.userId = userId;
        this.quiz = quiz;
        this.creationTime = creationTime;
        this.retired = retired;
        this.version = version;
    }

    public getName = (): string => this.name;
    public getDescription = (): string => this.description;
    public getLink = (): string => this.link;
    public getActive = (): boolean => this.active;
    public getMinTime = (): number | null => this.minTime;
    public getUserId = (): string => this.userId;
    public getQuiz = (): {
        maxAttempts: number | null;
        minScore: number | null;
        preserveOrder: boolean;
        timeLimit: number | null;
        totalMarks: number;
    } | null => this.quiz;
    public getCreationTime = (): firestore.Timestamp => this.creationTime;
    public getRetired = (): firestore.Timestamp | undefined => this.retired;
    public getVersion = (): number => this.version;

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

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): Course => {
        const data = doc.data();
        return new Course(doc.id, data.name, data.description, data.link, data.active, data.minTime, data.userId, data.quiz, data.creationTime, data.retired, data.version);
    }


    public static getAllDocs = () => DatabaseObject._getAllDocs(this.CollectionName).then((docs) => docs.map((course) => Course.fromFirestore(course)));
    public addtoFirestore = (id?: string): Promise<string> => this._addToFirestore(this.CollectionName, id);
}

export default Course;

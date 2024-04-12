import { DatabaseObject } from "./DatabseObject";
import { db } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from "firebase-admin";

interface QuizAttemptDocument {
    id?: string;
    userId: string;
    courseId: string;
    courseAttemptId: string;
    startTime: firestore.Timestamp;
    endTime: firestore.Timestamp | null;
    pass: boolean | null;
    score: number | null;
    markerInfo: {
        uid: string;
        name: string;
        email: string;
        markTime: firestore.Timestamp
    } | null;
}

class QuizAttempt extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    public readonly userId: string;
    public readonly courseId: string;
    public readonly courseAttemptId: string;
    public readonly startTime: firestore.Timestamp;
    public readonly endTime: firestore.Timestamp | null;
    public readonly pass: boolean | null;
    public readonly score: number | null;
    public readonly markerInfo: { // Details about by who and when the quiz was marked
        uid: string;
        name: string;
        email: string;
        markTime: firestore.Timestamp;
    } | null;

    constructor(quizAttempt: QuizAttemptDocument) {
        super(quizAttempt.id);

        this.userId = quizAttempt.userId;
        this.courseId = quizAttempt.courseId;
        this.courseAttemptId = quizAttempt.courseAttemptId;
        this.startTime = quizAttempt.startTime;
        this.endTime = quizAttempt.endTime;
        this.pass = quizAttempt.pass;
        this.score = quizAttempt.score;
        this.markerInfo = quizAttempt.markerInfo;
    }

    public getObject(noId?: boolean): QuizAttemptDocument {
        return {
            ...(!noId && { id: this.getId() }),
            userId: this.userId,
            courseId: this.courseId,
            courseAttemptId: this.courseAttemptId,
            startTime: this.startTime,
            endTime: this.endTime,
            pass: this.pass,
            score: this.score,
            markerInfo: this.markerInfo,
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): QuizAttempt => {
        const data = doc.data();
        const quizAttempt: QuizAttemptDocument = {
            id: doc.id,
            userId: data.userId,
            courseId: data.courseId,
            courseAttemptId: data.courseAttemptId,
            startTime: data.startTime,
            endTime: data.endTime,
            pass: data.pass,
            score: data.score,
            markerInfo: data.markerInfo
        };
        return new QuizAttempt(quizAttempt);
    }

    public static getAllDocs = (): Promise<QuizAttempt[]> => {
        const collectionName = this.constructor.name;
        return db.collection(collectionName)
            .get()
            .then((result) => result.docs.map(doc => QuizAttempt.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }
}

export default QuizAttempt;

import { DatabaseObject } from "./DatabseObject";
import { db } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from "firebase-admin";

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
    } | undefined;

    constructor(id: string, userId: string, courseId: string, courseAttemptId: string, startTime: firestore.Timestamp, endTime: firestore.Timestamp | null, pass: boolean | null, score: number | null, markerInfo?: { uid: string; name: string; email: string; markTime: firestore.Timestamp }) {
        super(id);

        this.userId = userId;
        this.courseId = courseId;
        this.courseAttemptId = courseAttemptId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pass = pass;
        this.score = score;
        this.markerInfo = markerInfo;
    }

    public getObject = (noId?: boolean): { id?: string; userId: string; courseId: string; courseAttemptId: string; startTime: number; endTime: number | null; pass: boolean | null; score: number | null; markerInfo: { uid: string; name: string; email: string; markTime: number } | null } => {
        return {
            ...(!noId && { id: this.getId() }),
            userId: this.userId,
            courseId: this.courseId,
            courseAttemptId: this.courseAttemptId,
            startTime: this.startTime.seconds,
            endTime: this.endTime?.seconds ?? null,
            pass: this.pass,
            score: this.score,
            markerInfo: this.markerInfo ? {
                uid: this.markerInfo.uid,
                name: this.markerInfo.name,
                email: this.markerInfo.email,
                markTime: this.markerInfo.markTime.seconds
            } : null
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): QuizAttempt => {
        const data = doc.data();
        return new QuizAttempt(doc.id, data.userId, data.courseId, data.courseAttemptId, data.startTime, data.endTime, data.pass, data.score, data.markerInfo);
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

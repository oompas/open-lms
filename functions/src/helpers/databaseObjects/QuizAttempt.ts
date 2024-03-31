import { DatabaseObject } from "./DatabseObject";
import { db } from "../setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from "firebase-admin";

class QuizAttempt extends DatabaseObject {

    private static CollectionName: string = "QuizAttempt";

    private readonly userId: string;
    private readonly courseId: string;
    private readonly courseAttemptId: string;
    private readonly startTime: firestore.Timestamp;
    private readonly endTime: firestore.Timestamp | null;
    private readonly pass: boolean | null;
    private readonly score: number | null;
    private readonly markerInfo: { // Details about by who and when the quiz was marked
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

    public getUserId = (): string => this.userId;
    public getCourseId = (): string => this.courseId;
    public getCourseAttemptId = (): string => this.courseAttemptId;
    public getStartTime = (): number => this.startTime.seconds;
    public getEndTime = (): number | null => this.endTime?.seconds ?? null;
    public getPass = (): boolean | null => this.pass;
    public getScore = (): number | null => this.score;
    public getMarkerInfo = (): { uid: string; name: string; email: string; markTime: number } | null => this.markerInfo ? {
        uid: this.markerInfo.uid,
        name: this.markerInfo.name,
        email: this.markerInfo.email,
        markTime: this.markerInfo.markTime.seconds
    } : null;

    public getObject = (): { id: string; userId: string; courseId: string; courseAttemptId: string; startTime: number; endTime: number | null; pass: boolean | null; score: number | null; markerInfo: { uid: string; name: string; email: string; markTime: number } | null } => {
        return {
            id: this.getId(),
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
        return db.collection(QuizAttempt.CollectionName)
            .get()
            .then((result) => result.docs.map(doc => QuizAttempt.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${QuizAttempt.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${QuizAttempt.CollectionName}'`);
            });
    }
}

export default QuizAttempt;

import { DatabaseObject } from "./DatabseObject";
import { db } from "../setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from "firebase-admin";

class QuizAttempt extends DatabaseObject {

    private static CollectionName: string = "QuizAttempt";

    private readonly userId: string;
    private readonly quizId: string;
    private readonly attemptTime: number;
    private readonly score: number;

    constructor(id: string, userId: string, quizId: string, attemptTime: number, score: number) {
        super(id);

        this.userId = userId;
        this.quizId = quizId;
        this.attemptTime = attemptTime;
        this.score = score;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getQuizId(): string {
        return this.quizId;
    }

    public getAttemptTime(): number {
        return this.attemptTime;
    }

    public getScore(): number {
        return this.score;
    }

    public getObject(): { id: string; userId: string; quizId: string; attemptTime: number; score: number } {
        return {
            id: this.getId(),
            userId: this.userId,
            quizId: this.quizId,
            attemptTime: this.attemptTime,
            score: this.score
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): QuizAttempt => {
        const data = doc.data();
        return new QuizAttempt(doc.id, data.userId, data.quizId, data.attemptTime, data.score);
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

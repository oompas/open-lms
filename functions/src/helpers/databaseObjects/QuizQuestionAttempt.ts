import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import { db } from "../setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

class QuizQuestionAttempt extends DatabaseObject {

    private static CollectionName: string = "QuizQuestionAttempt";

    private readonly userId: string;
    private readonly quizQuestionId: string;
    private readonly attemptTime: number;
    private readonly answer: string;
    private readonly score: number;

    constructor(id: string, userId: string, quizQuestionId: string, attemptTime: number, answer: string, score: number) {
        super(id);

        this.userId = userId;
        this.quizQuestionId = quizQuestionId;
        this.attemptTime = attemptTime;
        this.answer = answer;
        this.score = score;
    }

    public getUserId(): string {
        return this.userId;
    }

    public getQuizQuestionId(): string {
        return this.quizQuestionId;
    }

    public getAttemptTime(): number {
        return this.attemptTime;
    }

    public getAnswer(): string {
        return this.answer;
    }

    public getScore(): number {
        return this.score;
    }

    public getObject(): { id: string; userId: string; quizQuestionId: string; attemptTime: number; answer: string; score: number } {
        return {
            id: this.getId(),
            userId: this.userId,
            quizQuestionId: this.quizQuestionId,
            attemptTime: this.attemptTime,
            answer: this.answer,
            score: this.score
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): QuizQuestionAttempt => {
        const data = doc.data();
        return new QuizQuestionAttempt(doc.id, data.userId, data.quizQuestionId, data.attemptTime, data.answer, data.score);
    }

    public static getAllDocs = (): Promise<QuizQuestionAttempt[]> => {
        return db.collection(QuizQuestionAttempt.CollectionName)
            .get()
            .then((result) => result.docs.map(doc => QuizQuestionAttempt.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${QuizQuestionAttempt.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${QuizQuestionAttempt.CollectionName}'`);
            });
    }
}

export default QuizQuestionAttempt;

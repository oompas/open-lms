import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import { db } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

interface QuizQuestionAttemptDocument {
    id?: string;
    userId: string;
    courseId: string;
    courseAttemptId: string;
    quizAttemptId: string;
    questionId: string;
    response: string | number;
    marksAchieved: number | null;
    maxMarks: number;
    timestamp: firestore.Timestamp;
}

class QuizQuestionAttempt extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    private readonly userId: string;
    private readonly courseId: string;
    private readonly courseAttemptId: string;
    private readonly quizAttemptId: string;
    private readonly questionId: string;
    private readonly response: string | number;
    private readonly marksAchieved: number | null;
    private readonly maxMarks: number;
    private readonly timestamp: firestore.Timestamp;

    constructor(attempt: QuizQuestionAttemptDocument) {
        super(attempt.id);

        this.userId = attempt.userId;
        this.courseId = attempt.courseId;
        this.courseAttemptId = attempt.courseAttemptId;
        this.quizAttemptId = attempt.quizAttemptId;
        this.questionId = attempt.questionId;
        this.response = attempt.response;
        this.marksAchieved = attempt.marksAchieved;
        this.maxMarks = attempt.maxMarks;
        this.timestamp = attempt.timestamp;
    }

    public getObject(noId?: boolean): QuizQuestionAttemptDocument {
        return {
            ...(!noId && { id: this.getId() }),
            userId: this.userId,
            courseId: this.courseId,
            courseAttemptId: this.courseAttemptId,
            quizAttemptId: this.quizAttemptId,
            questionId: this.questionId,
            response: this.response,
            marksAchieved: this.marksAchieved,
            maxMarks: this.maxMarks,
            timestamp: this.timestamp
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): QuizQuestionAttempt => {
        const data = doc.data();
        const attempt: QuizQuestionAttemptDocument = {
            id: doc.id,
            userId: data.userId,
            courseId: data.courseId,
            courseAttemptId: data.courseAttemptId,
            quizAttemptId: data.quizAttemptId,
            questionId: data.questionId,
            response: data.response,
            marksAchieved: data.marksAchieved,
            maxMarks: data.maxMarks,
            timestamp: data.timestamp
        };
        return new QuizQuestionAttempt(attempt);
    }

    public static getAllDocs = (): Promise<QuizQuestionAttempt[]> => {
        const collectionName = this.constructor.name;
        return db.collection(collectionName)
            .get()
            .then((result) => result.docs.map(doc => QuizQuestionAttempt.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }
}

export default QuizQuestionAttempt;

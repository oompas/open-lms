import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
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

    public static fromFirestore(doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): QuizQuestionAttempt {
        const attempt: QuizQuestionAttemptDocument = {
            id: doc.id,
            userId: doc.get("userId"),
            courseId: doc.get("courseId"),
            courseAttemptId: doc.get("courseAttemptId"),
            quizAttemptId: doc.get("quizAttemptId"),
            questionId: doc.get("questionId"),
            response: doc.get("response"),
            marksAchieved: doc.get("marksAchieved"),
            maxMarks: doc.get("maxMarks"),
            timestamp: doc.get("timestamp")
        };
        return new QuizQuestionAttempt(attempt);
    }

    public static getDocumentById = (id: string): Promise<QuizQuestionAttempt> => super._getDocumentById(this.collection, id).then(doc => this.fromFirestore(doc));

    public static getAllDocs = () => super._getAllDocs(this.collection).then((docs) => docs.map((doc) => this.fromFirestore(doc)));

    public static delete = (docId: string) => super._delete(this.collection, docId);
}

export default QuizQuestionAttempt;

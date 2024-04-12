import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../helpers/setup";

class QuizQuestion extends DatabaseObject {

    private readonly courseId: string;
    private readonly question: string;
    private readonly type: "tf" | "mc" | "sa";
    private readonly marks: number;
    private readonly answers: string[] | undefined
    private readonly correctAnswer: number | undefined;
    private readonly order: number | undefined;
    private readonly stats: {
        numAttempts: number;
        totalScore: number;
        answers?: { [key: string]: number }; // Only for t/f & mc
        distribution?: { [key: string]: number }; // Only for sa
    };

    constructor(question: { id: string, courseId: string, question: string, type: "tf" | "mc" | "sa", marks: number, answers?: string[], correctAnswer?: number, order?: number }) {
        super(question.id);

        this.courseId = question.courseId;
        this.question = question.question;
        this.type = question.type;
        this.marks = question.marks;
        this.answers = question.answers;
        this.correctAnswer = question.correctAnswer;
        this.order = question.order;

        this.stats = {
            numAttempts: 0,
            totalScore: 0,
            ...(question.type === "tf" || question.type === "mc" ? { answers: {} } : { distribution: {} }),
            ...(question.type === "sa" ? { distribution: {} } : { answers: {} }),
        };
    }

    public static collection = () => db.collection(this.constructor.name);

    public getObject(): { id: string; courseId: string; question: string; type: "tf" | "mc" | "sa"; marks: number; answers?: string[]; correctAnswer?: number; order?: number; stats: { numAttempts: number; totalScore: number; answers?: { [key: string]: number }; distribution?: { [key: string]: number } } } {
        return {
            id: this.getId(),
            courseId: this.courseId,
            question: this.question,
            type: this.type,
            marks: this.marks,
            answers: this.answers,
            correctAnswer: this.correctAnswer,
            order: this.order,
            stats: this.stats,
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): QuizQuestion => {
        const data = doc.data();
        const question = {
            id: doc.id,
            courseId: data.courseId,
            question: data.question,
            type: data.type,
            marks: data.marks,
            answers: data.answers,
            correctAnswer: data.correctAnswer,
            order: data.order
        };
        return new QuizQuestion(question);
    }

    public static getAllDocs = (): Promise<QuizQuestion[]> => {
        const collectionName = this.constructor.name;
        return db.collection(collectionName)
            .get()
            .then((result) => result.docs.map(doc => QuizQuestion.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }
}

export default QuizQuestion;

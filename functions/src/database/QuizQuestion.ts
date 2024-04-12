import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../helpers/setup";

class QuizQuestion extends DatabaseObject {

    private static CollectionName: string = "QuizQuestion";

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

    constructor(id: string, courseId: string, question: string, type: "tf" | "mc" | "sa", marks: number, answers?: string[], correctAnswer?: number, order?: number) {
        super(id);

        this.courseId = courseId;
        this.question = question;
        this.type = type;
        this.marks = marks;
        this.answers = answers;
        this.correctAnswer = correctAnswer;
        this.order = order;

        this.stats = {
            numAttempts: 0,
            totalScore: 0,
            ...(type === "tf" || type === "mc" ? { answers: {} } : { distribution: {} }),
            ...(type === "sa" ? { distribution: {} } : { answers: {} }),
        };
    }

    public getCourseId = (): string => this.courseId;
    public getQuestion = (): string => this.question;
    public getType = (): "tf" | "mc" | "sa" => this.type;
    public getMarks = (): number => this.marks;
    public getAnswers = (): string[] | undefined => this.answers;
    public getCorrectAnswer = (): number | undefined => this.correctAnswer;
    public getOrder = (): number | undefined => this.order;
    public getStats = (): { numAttempts: number; totalScore: number; answers?: { [key: string]: number }; distribution?: { [key: string]: number } } => this.stats;

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
        return new QuizQuestion(doc.id, data.courseId, data.question, data.type, data.marks, data.answers, data.correctAnswer, data.order);
    }

    public static getAllDocs = (): Promise<QuizQuestion[]> => {
        return db.collection(QuizQuestion.CollectionName)
            .get()
            .then((result) => result.docs.map(doc => QuizQuestion.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${QuizQuestion.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${QuizQuestion.CollectionName}'`);
            });
    }
}

export default QuizQuestion;

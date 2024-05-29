import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import Course from "./Course";

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

    public static fromFirestore(doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): QuizAttempt {
        const quizAttempt: QuizAttemptDocument = {
            id: doc.id,
            userId: doc.get("userId"),
            courseId: doc.get("courseId"),
            courseAttemptId: doc.get("courseAttemptId"),
            startTime: doc.get("startTime"),
            endTime: doc.get("endTime"),
            pass: doc.get("pass"),
            score: doc.get("score"),
            markerInfo: doc.get("markerInfo"),
        };
        return new QuizAttempt(quizAttempt);
    }

    public static getDocumentById = (id: string): Promise<QuizAttempt> => super._getDocumentById(this.collection, id).then(doc => this.fromFirestore(doc));

    public static getAllDocs = () => super._getAllDocs(this.collection).then((docs) => docs.map((doc) => this.fromFirestore(doc)));

    public static delete = (docId: string) => super._delete(this.collection, docId);


    /**
     * Check if the quiz attempt has expired (not submitted in time) before getting the quiz attempt
     */
    public async checkExpired(): Promise<boolean> {

        const courseData = await Course.getDocumentById(this.courseAttemptId);

        if (courseData.quiz?.timeLimit && Date.now() > this.startTime.toMillis() + (courseData.quiz.timeLimit * 60 * 1000)) {

            // If the attempt has expired -> fail the attempt
            const quizAttemptUpdate = {
                endTime: firestore.Timestamp.now(),
                pass: false,
                score: 0,
            };
            await super.updateFirestore(quizAttemptUpdate);

            // If this was the last quiz attempt, fail the course attempt
            if (courseData.quiz.maxAttempts) {
                const quizAttempts = await QuizAttempt.collection
                    .where("courseId", "==", courseAttempt.courseId)
                    .where("userId", "==", request.auth?.uid)
                    .get()
                    .then((snapshot) => {
                        if (snapshot.empty) {
                            logger.error(`No quiz attempts found for course ${courseAttempt.courseId}`);
                            throw new HttpsError("not-found", `No quiz attempts found for course ${courseAttempt.courseId}`);
                        }
                        return snapshot.docs;
                    })
                    .catch((err) => {
                        logger.info(`Error getting quiz attempts: ${err}`);
                        throw new HttpsError("internal", `Error getting quiz attempts: ${err}`);
                    });

                if (quizAttempts.length >= courseData.quiz.maxAttempts) {
                    const updateCourseAttempt = {
                        endTime: firestore.FieldValue.serverTimestamp(),
                        pass: false,
                    };
                    await updateDoc(DatabaseCollections.CourseAttempt, courseAttempt.getId(), updateCourseAttempt);
                }
            }

            return true;
        }

        return false;
    }
}

export default QuizAttempt;

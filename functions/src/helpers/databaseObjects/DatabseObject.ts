import { db } from "../setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/v2/providers/https";

abstract class DatabaseObject {

    protected abstract CollectionName: string;

    private readonly id: string;

    protected constructor(id: string) {
        this.id = id;
    }

    public getId(): string {
        return this.id;
    }

    /**
     * Returns the database document as a JSON object with document data & id
     */
    abstract getObject(noId?: boolean): object;

    /**
     * Adds the object to Firestore as a new object
     * @param id (Optional) The ID of the document
     */
    protected abstract addtoFirestore(id?: string): Promise<string>;

    protected static getAllDocs = (): Promise<Course[]> => {
        return db.collection(this.CollectionName)
            .get()
            .then((result) => result.docs.map(doc => Course.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${this.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${this.CollectionName}'`);
            });
    }

    // Helper function, allows child classes to specify their own collection name
    protected _addToFirestore = (collectionName: string, id?: string): Promise<string> => {
        if (id) {
            return db.collection(collectionName)
                .doc(id)
                .set(this.getObject(true))
                .then(() => id)
                .catch((err) => {
                    logger.error(`Error setting document in collection '${this.CollectionName}': ${err}`);
                    throw new HttpsError("internal", `Error setting document in collection '${this.CollectionName}'`);
                });
        }

        return db.collection(this.CollectionName)
            .add(this.getObject(true))
            .then((doc) => doc.id)
            .catch((err) => {
                logger.error(`Error adding document to collection '${this.CollectionName}': ${err}`);
                throw new HttpsError("internal", `Error adding document to collection '${this.CollectionName}'`);
            });
    }
}

export { DatabaseObject };

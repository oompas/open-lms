import { db } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from "firebase-admin";

abstract class DatabaseObject {

    private readonly id: string | undefined;

    protected constructor(id: string | undefined) {
        this.id = id;
    }

    public getId = (): string => {
        if (this.id === undefined) {
            throw new HttpsError('failed-precondition', `id is undefined for type ${this.constructor.name}`);
        }
        return this.id;
    }

    /**
     * Returns this object as a JSON object with document data
     * @param noId (Optional) If true, the document ID will not be included in the object
     */
    abstract getObject(noId?: boolean): object;

    /**
     * Adds the object to Firestore as a new object
     * @param withId (Optional) If true, uses the document's id as the document id in Firestore, otherwise Firestore will generate a new id
     */
    public addToFirestore(withId?: boolean): Promise<string> {
        const collectionName = this.constructor.name;
        if (withId) {
            return db.collection(collectionName)
                .doc(this.getId())
                .set(this.getObject(true))
                .then(() => this.getId())
                .catch((err) => {
                    logger.error(`Error setting document in collection '${collectionName}': ${err}`);
                    throw new HttpsError("internal", `Error setting document in collection '${collectionName}'`);
                });
        }

        return db.collection(collectionName)
            .add(this.getObject(true))
            .then((doc) => doc.id)
            .catch((err) => {
                logger.error(`Error adding document to collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error adding document to collection '${collectionName}'`);
            });
    }

    /**
     * Updates this object in Firestore
     */
    public updateInFirestore(): Promise<firestore.WriteResult> {
        return db.collection(this.constructor.name)
            .doc(this.getId())
            .update(this.getObject(true))
            .catch((err) => {
                logger.error(`Error updating document in collection '${this.constructor.name}': ${err}`);
                throw new HttpsError("internal", `Error updating document in collection '${this.constructor.name}'`);
            });
    }

    /**
     * Update specific fields in the given object
     */
    protected updateFirestore(updates: object): Promise<any> {
        return db.collection(this.constructor.name)
            .doc(this.getId())
            .update(updates)
            .catch((err) => {
                logger.error(`Error updating document in collection '${this.constructor.name}': ${err}`);
                throw new HttpsError("internal", `Error updating document in collection '${this.constructor.name}'`);
            })
    }

    /**
     * Deletes this object from Firestore
     */
    public deleteFromFirestore(): Promise<firestore.WriteResult> {
        return db.collection(this.constructor.name)
            .doc(this.getId())
            .delete()
            .catch((err) => {
                logger.error(`Error deleting document from collection '${this.constructor.name}': ${err}`);
                throw new HttpsError("internal", `Error deleting document from collection '${this.constructor.name}'`);
            });
    }

    // Helper to get all documents from a collection
    protected static _getAllDocs = (): Promise<firestore.QueryDocumentSnapshot[]> => {
        const collectionName = this.constructor.name;
        return db.collection(collectionName)
            .get()
            .then((result) => result.docs)
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }
}

export { DatabaseObject };

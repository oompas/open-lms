import { db } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from "firebase-admin";

abstract class DatabaseObject {

    private readonly id: string | undefined;

    protected constructor(id: string | undefined) {
        if (typeof id === 'string' && !(id.match(/^[a-zA-Z0-9]{20}$/) || id.match(/^[a-zA-Z0-9]{28}$/))) {
            throw new HttpsError("invalid-argument", `Document IDs must be a 20 (or 28 for UIDs) alphanumeric characters (value: ${id})`);
        }
        this.id = id;
    }

    public getId = (): string => {
        if (this.id === undefined) {
            throw new HttpsError('failed-precondition', `id is undefined for type ${this.constructor.name}`);
        }
        return this.id;
    }

    /**
     * Gets a reference to a specified Firestore collection
     */
    protected static getCollection = (collectionName: string) => db.collection(collectionName);

    /**
     * Returns this object as a JSON object with document data
     * @param noId (Optional) If true, the document ID will not be included in the object
     */
    protected abstract getObject(noId?: boolean): object;

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

    //
    // Static helpers - require a call from bass class due to being static
    //

    protected static _getDocumentById(collection: firestore.CollectionReference, id: string): Promise<firestore.DocumentSnapshot> {
        return collection
            .doc(id)
            .get()
            .then(doc => {
                if (!doc.exists) {
                    logger.error(`Document with id '${id}' not found in collection '${collection.path}'`);
                    throw new HttpsError("not-found", `Document with id '${id}' not found in collection '${collection.path}'`);
                }
                return doc;
            })
            .catch(err => {
                logger.error(`Error getting document with id '${id}' from collection '${collection.path}': ${err}`);
                throw new HttpsError("internal", `Error getting document with id '${id}' from collection '${collection.path}'`);
            });
    }

    protected static _delete(collection: firestore.CollectionReference, docId: string): Promise<firestore.WriteResult> {
        return collection
            .doc()
            .delete()
            .catch((err) => {
                logger.error(`Error deleting document '${docId}' from collection '${collection.path}': ${err}`);
                throw new HttpsError("internal", `Error deleting document '${docId}' from collection '${collection.path}'`);
            });
    }

    protected static _getAllDocs(collection: firestore.CollectionReference): Promise<firestore.QueryDocumentSnapshot[]> {
        return collection
            .get()
            .then((result) => result.docs)
            .catch(err => {
                logger.error(`Error getting documents from collection '${collection.path}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collection.path}'`);
            });
    }
}

export { DatabaseObject };

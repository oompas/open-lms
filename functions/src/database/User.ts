import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import { db } from "../helpers/setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

class User extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    public readonly email: string;
    public readonly name: string;
    public readonly signUpTime: firestore.Timestamp;
    public readonly admin: boolean;
    public readonly developer: boolean;

    constructor(id: string, email: string, name: string, signUpTime: firestore.Timestamp, admin: boolean, developer: boolean) {
        super(id);

        this.email = email;
        this.name = name;
        this.signUpTime = signUpTime;
        this.admin = admin;
        this.developer = developer;
    }

    public getObject(): { id: string; email: string; name: string; signUpTime: number; admin: boolean; developer: boolean } {
        return {
            id: this.getId(),
            email: this.email,
            name: this.name,
            signUpTime: this.signUpTime.seconds,
            admin: this.admin,
            developer: this.developer
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): User => {
        const data = doc.data();
        return new User(doc.id, data.email, data.name, data.signUpTime, data.admin, data.developer);
    }

    public static fromFirestoreId = (id: string): Promise<User> => {
        return this.collection
            .doc(id)
            .get()
            .then(doc => {
                if (!doc.exists) {
                    logger.error(`Document with id '${id}' not found in collection '${this.constructor.name}'`);
                    throw new HttpsError("not-found", `Document with id '${id}' not found in collection '${this.constructor.name}'`);
                }
                const data = doc.data(); // @ts-ignore
                return new User(doc.id, data.email, data.name, data.signUpTime, data.admin, data.developer);
            })
            .catch(err => {
                logger.error(`Error getting document with id '${id}' from collection '${this.constructor.name}': ${err}`);
                throw new HttpsError("internal", `Error getting document with id '${id}' from collection '${this.constructor.name}'`);
            });
    }

    public static getAllDocs = (): Promise<User[]> => {
        const collectionName = this.constructor.name;
        return db.collection(collectionName)
            .get()
            .then((result) => result.docs.map(doc => User.fromFirestore(doc)))
            .catch(err => {
                logger.error(`Error getting documents from collection '${collectionName}': ${err}`);
                throw new HttpsError("internal", `Error getting documents from collection '${collectionName}'`);
            });
    }
}

export default User;

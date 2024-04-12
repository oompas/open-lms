import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";
import { db } from "../setup";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

class User extends DatabaseObject {

    private readonly email: string;
    private readonly name: string;
    private readonly signUpTime: firestore.Timestamp;
    private readonly admin: boolean | undefined;
    private readonly developer: boolean | undefined;

    constructor(id: string, email: string, name: string, signUpTime: firestore.Timestamp, admin: boolean, developer: boolean) {
        super(id);

        this.email = email;
        this.name = name;
        this.signUpTime = signUpTime;
        this.admin = admin;
        this.developer = developer;
    }

    public getEmail = (): string => this.email;
    public getName = (): string => this.name;
    public getSignUpTime = (): number => this.signUpTime.seconds;
    public isAdmin = (): boolean => !!this.admin;
    public isDeveloper = (): boolean => !!this.developer;

    public getObject(): { id: string; email: string; name: string; signUpTime: number; admin: boolean; developer: boolean } {
        return {
            id: this.getId(),
            email: this.email,
            name: this.name,
            signUpTime: this.signUpTime.seconds,
            admin: !!this.admin,
            developer: !!this.developer
        };
    }

    public static fromFirestore = (doc: firestore.QueryDocumentSnapshot): User => {
        const data = doc.data();
        return new User(doc.id, data.email, data.name, data.signUpTime, data.admin, data.developer);
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

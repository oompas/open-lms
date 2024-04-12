import { DatabaseObject } from "./DatabseObject";
import { firestore } from "firebase-admin";

interface UserObject {
    id?: string;
    email: string;
    name: string;
    signUpTime: firestore.Timestamp;
    admin: boolean;
    developer: boolean;
}

class User extends DatabaseObject {

    public static readonly collectionName = this.constructor.name;
    public static readonly collection = DatabaseObject.getCollection(this.collectionName);

    public readonly email: string;
    public readonly name: string;
    public readonly signUpTime: firestore.Timestamp;
    public readonly admin: boolean;
    public readonly developer: boolean;

    constructor(user: UserObject) {
        super(user.id);

        this.email = user.email;
        this.name = user.name;
        this.signUpTime = user.signUpTime;
        this.admin = user.admin;
        this.developer = user.developer;
    }

    public getObject(noId?: boolean): UserObject {
        return {
            ...(!noId && { id: this.getId() }),
            email: this.email,
            name: this.name,
            signUpTime: this.signUpTime,
            admin: this.admin,
            developer: this.developer
        };
    }

    private static fromFirestore(doc: firestore.QueryDocumentSnapshot | firestore.DocumentSnapshot): User {
        const user: UserObject = {
            id: doc.id,
            email: doc.get("email"),
            name: doc.get("name"),
            signUpTime: doc.get("signUpTime"),
            admin: doc.get("admin"),
            developer: doc.get("developer")
        };
        return new User(user);
    }

    public static getDocumentById = (id: string): Promise<User> => this._getDocumentById(this.collection, id).then(doc => User.fromFirestore(doc));

    public static getAllDocs = (): Promise<User[]> => this._getAllDocs(this.collection).then(docs => docs.map(doc => User.fromFirestore(doc)));
}

export default User;
